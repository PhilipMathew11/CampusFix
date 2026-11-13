package com.campusfix.controller;

import com.campusfix.dto.ApiDtos.ComplaintRequest;
import com.campusfix.dto.ApiDtos.ComplaintResponse;
import com.campusfix.dto.ApiDtos.DashboardStats;
import com.campusfix.dto.ApiDtos.PriorityRequest;
import com.campusfix.dto.ApiDtos.StatusRequest;
import com.campusfix.model.ComplaintCategory;
import com.campusfix.model.ComplaintStatus;
import com.campusfix.model.Priority;
import com.campusfix.model.Role;
import com.campusfix.service.ComplaintService;
import com.campusfix.service.CurrentUserService;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.ResponseStatus;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

@RestController
@RequestMapping("/api")
public class ComplaintController {

    private final ComplaintService complaintService;
    private final CurrentUserService currentUserService;

    public ComplaintController(ComplaintService complaintService, CurrentUserService currentUserService) {
        this.complaintService = complaintService;
        this.currentUserService = currentUserService;
    }

    @PostMapping("/complaints")
    @ResponseStatus(HttpStatus.CREATED)
    public ComplaintResponse create(@Valid @RequestBody ComplaintRequest request,
                                    @AuthenticationPrincipal UserDetails principal) {
        return complaintService.create(request, currentUserService.requireUser(principal));
    }

    @GetMapping("/complaints")
    public List<ComplaintResponse> list(@AuthenticationPrincipal UserDetails principal,
                                        @RequestParam(required = false) ComplaintStatus status,
                                        @RequestParam(required = false) ComplaintCategory category,
                                        @RequestParam(required = false) Priority priority) {
        var user = currentUserService.requireUser(principal);
        return complaintService.findAll(user, user.getRole() == Role.ADMIN, status, category, priority);
    }

    @GetMapping("/complaints/{id}")
    public ComplaintResponse detail(@PathVariable Long id, @AuthenticationPrincipal UserDetails principal) {
        var user = currentUserService.requireUser(principal);
        return complaintService.findOne(id, user, user.getRole() == Role.ADMIN);
    }

    @PatchMapping("/admin/complaints/{id}/status")
    @PreAuthorize("hasRole('ADMIN')")
    public ComplaintResponse updateStatus(@PathVariable Long id, @Valid @RequestBody StatusRequest request,
                                          @AuthenticationPrincipal UserDetails principal) {
        return complaintService.updateStatus(id, request.status(), request.remarks(),
                currentUserService.requireUser(principal));
    }

    @PatchMapping("/admin/complaints/{id}/priority")
    @PreAuthorize("hasRole('ADMIN')")
    public ComplaintResponse updatePriority(@PathVariable Long id, @Valid @RequestBody PriorityRequest request,
                                            @AuthenticationPrincipal UserDetails principal) {
        return complaintService.updatePriority(id, request.priority(), currentUserService.requireUser(principal));
    }

    @GetMapping("/admin/stats")
    @PreAuthorize("hasRole('ADMIN')")
    public DashboardStats stats() {
        return complaintService.getStats();
    }
}
