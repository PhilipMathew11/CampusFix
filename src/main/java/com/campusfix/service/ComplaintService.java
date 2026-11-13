package com.campusfix.service;

import com.campusfix.dto.ApiDtos.ComplaintRequest;
import com.campusfix.dto.ApiDtos.ComplaintResponse;
import com.campusfix.dto.ApiDtos.DashboardStats;
import com.campusfix.dto.ApiDtos.HistoryResponse;
import com.campusfix.model.Complaint;
import com.campusfix.model.ComplaintCategory;
import com.campusfix.model.ComplaintStatus;
import com.campusfix.model.Priority;
import com.campusfix.model.StatusHistory;
import com.campusfix.model.User;
import com.campusfix.repository.ComplaintRepository;
import com.campusfix.repository.StatusHistoryRepository;
import com.campusfix.repository.UserRepository;
import org.springframework.data.jpa.domain.Specification;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

import java.time.Instant;
import java.util.List;

@Service
public class ComplaintService {

    private final ComplaintRepository complaintRepository;
    private final StatusHistoryRepository historyRepository;
    private final UserRepository userRepository;

    public ComplaintService(ComplaintRepository complaintRepository, StatusHistoryRepository historyRepository,
                            UserRepository userRepository) {
        this.complaintRepository = complaintRepository;
        this.historyRepository = historyRepository;
        this.userRepository = userRepository;
    }

    @Transactional
    public ComplaintResponse create(ComplaintRequest request, User student) {
        Complaint complaint = complaintRepository.saveAndFlush(new Complaint(request.title().trim(),
                request.description().trim(), request.location().trim(), request.category(), request.priority(),
                student));
        complaint.assignComplaintCode();
        historyRepository.save(new StatusHistory(complaint, complaint.getStatus(), "Complaint submitted", student));
        return toResponse(complaint);
    }

    @Transactional(readOnly = true)
    public List<ComplaintResponse> findAll(User viewer, boolean admin, ComplaintStatus status,
                                           ComplaintCategory category, Priority priority) {
        Specification<Complaint> specification = (root, query, cb) -> cb.conjunction();
        if (!admin) {
            specification = specification.and((root, query, cb) -> cb.equal(root.get("student").get("id"), viewer.getId()));
        }
        if (status != null) {
            specification = specification.and((root, query, cb) -> cb.equal(root.get("status"), status));
        }
        if (category != null) {
            specification = specification.and((root, query, cb) -> cb.equal(root.get("category"), category));
        }
        if (priority != null) {
            specification = specification.and((root, query, cb) -> cb.equal(root.get("priority"), priority));
        }
        return complaintRepository.findAll(specification,
                        org.springframework.data.domain.Sort.by(org.springframework.data.domain.Sort.Direction.DESC, "createdAt"))
                .stream().map(this::toResponse).toList();
    }

    @Transactional(readOnly = true)
    public ComplaintResponse findOne(Long id, User viewer, boolean admin) {
        Complaint complaint = requireComplaint(id);
        if (!admin && !complaint.getStudent().getId().equals(viewer.getId())) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, "You cannot access another student's complaint");
        }
        return toResponse(complaint);
    }

    @Transactional
    public ComplaintResponse updateStatus(Long id, ComplaintStatus status, String remarks, User admin) {
        Complaint complaint = requireComplaint(id);
        String cleanRemarks = remarks == null || remarks.isBlank() ? null : remarks.trim();
        complaint.updateStatus(status, cleanRemarks);
        historyRepository.save(new StatusHistory(complaint, status, cleanRemarks, admin));
        return toResponse(complaint);
    }

    @Transactional
    public ComplaintResponse updatePriority(Long id, Priority priority, User admin) {
        Complaint complaint = requireComplaint(id);
        complaint.updatePriority(priority);
        complaintRepository.save(complaint);
        historyRepository.save(new StatusHistory(complaint, complaint.getStatus(),
                "Priority updated to " + priority.name().replace('_', ' ').toLowerCase(), admin));
        return toResponse(complaint);
    }

    @Transactional(readOnly = true)
    public DashboardStats getStats() {
        List<Complaint> complaints = complaintRepository.findAll();
        Instant sevenDaysAgo = Instant.now().minusSeconds(7 * 24 * 60 * 60);
        return new DashboardStats(
                complaints.size(),
                countByStatus(complaints, ComplaintStatus.PENDING),
                countByStatus(complaints, ComplaintStatus.IN_PROGRESS),
                countByStatus(complaints, ComplaintStatus.RESOLVED),
                complaints.stream().filter(c -> c.getPriority() == Priority.HIGH).count(),
                countByStatus(complaints, ComplaintStatus.UNDER_REVIEW),
                countByStatus(complaints, ComplaintStatus.REJECTED),
                complaints.stream().filter(c -> c.getCreatedAt().isAfter(sevenDaysAgo)).count());
    }

    private long countByStatus(List<Complaint> complaints, ComplaintStatus status) {
        return complaints.stream().filter(c -> c.getStatus() == status).count();
    }

    private Complaint requireComplaint(Long id) {
        return complaintRepository.findById(id)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Complaint not found"));
    }

    private ComplaintResponse toResponse(Complaint complaint) {
        List<HistoryResponse> history = historyRepository.findByComplaintIdOrderByChangedAtAsc(complaint.getId())
                .stream().map(this::toHistoryResponse).toList();
        return new ComplaintResponse(complaint.getId(), complaint.getComplaintCode(), complaint.getTitle(),
                complaint.getDescription(), complaint.getLocation(), complaint.getCategory(), complaint.getPriority(),
                complaint.getStatus(), complaint.getResolutionRemarks(), complaint.getStudent().getName(),
                complaint.getStudent().getEmail(), complaint.getCreatedAt(), complaint.getUpdatedAt(), history);
    }

    private HistoryResponse toHistoryResponse(StatusHistory entry) {
        return new HistoryResponse(entry.getId(), entry.getStatus(), entry.getRemarks(),
                entry.getChangedBy().getName(), entry.getChangedAt());
    }
}
