package com.campusfix.dto;

import com.campusfix.model.ComplaintCategory;
import com.campusfix.model.ComplaintStatus;
import com.campusfix.model.Priority;
import com.campusfix.model.Role;
import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;

import java.time.Instant;
import java.util.List;

public final class ApiDtos {

    private ApiDtos() {
    }

    public record RegisterRequest(
            @NotBlank @Size(max = 100) String name,
            @NotBlank @Email @Size(max = 160) String email,
            @NotBlank @Size(min = 8, max = 72) String password) {
    }

    public record LoginRequest(@NotBlank @Email String email, @NotBlank String password) {
    }

    public record UserResponse(Long id, String name, String email, Role role) {
    }

    public record ComplaintRequest(
            @NotBlank @Size(max = 140) String title,
            @NotBlank @Size(max = 4000) String description,
            @NotBlank @Size(max = 200) String location,
            @NotNull ComplaintCategory category,
            @NotNull Priority priority) {
    }

    public record StatusRequest(@NotNull ComplaintStatus status, @Size(max = 2000) String remarks) {
    }

    public record PriorityRequest(@NotNull Priority priority) {
    }

    public record HistoryResponse(Long id, ComplaintStatus status, String remarks,
                                  String changedBy, Instant changedAt) {
    }

    public record ComplaintResponse(Long id, String complaintCode, String title, String description,
                                    String location, ComplaintCategory category, Priority priority,
                                    ComplaintStatus status, String resolutionRemarks, String studentName,
                                    String studentEmail, Instant createdAt, Instant updatedAt,
                                    List<HistoryResponse> history) {
    }

    public record DashboardStats(long total, long pending, long inProgress, long resolved, long highPriority,
                                 long underReview, long rejected, long lastSevenDays) {
    }

    public record MessageResponse(String message) {
    }
}
