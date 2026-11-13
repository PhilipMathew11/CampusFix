package com.campusfix.model;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.FetchType;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.PrePersist;
import jakarta.persistence.Table;
import jakarta.persistence.UniqueConstraint;

import java.time.Instant;

@Entity
@Table(name = "complaints", uniqueConstraints = @UniqueConstraint(columnNames = "complaint_code"))
public class Complaint {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "complaint_code", length = 20, unique = true)
    private String complaintCode;

    @Column(nullable = false, length = 140)
    private String title;

    @Column(nullable = false, length = 4000)
    private String description;

    @Column(nullable = false, length = 200)
    private String location;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 30)
    private ComplaintCategory category;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 20)
    private Priority priority;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 24)
    private ComplaintStatus status;

    @Column(length = 2000)
    private String resolutionRemarks;

    @Column(nullable = false, updatable = false)
    private Instant createdAt;

    @Column(nullable = false)
    private Instant updatedAt;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "student_id", nullable = false)
    private User student;

    protected Complaint() {
    }

    public Complaint(String title, String description, String location, ComplaintCategory category,
                     Priority priority, User student) {
        this.title = title;
        this.description = description;
        this.location = location;
        this.category = category;
        this.priority = priority;
        this.status = ComplaintStatus.PENDING;
        this.student = student;
    }

    @PrePersist
    void setTimestamps() {
        createdAt = Instant.now();
        updatedAt = createdAt;
    }

    public void assignComplaintCode() {
        complaintCode = "CF-" + String.format("%06d", id);
    }

    public void updateStatus(ComplaintStatus status, String remarks) {
        this.status = status;
        this.resolutionRemarks = remarks;
        this.updatedAt = Instant.now();
    }

    public void updatePriority(Priority priority) {
        this.priority = priority;
        this.updatedAt = Instant.now();
    }

    public Long getId() { return id; }
    public String getComplaintCode() { return complaintCode; }
    public String getTitle() { return title; }
    public String getDescription() { return description; }
    public String getLocation() { return location; }
    public ComplaintCategory getCategory() { return category; }
    public Priority getPriority() { return priority; }
    public ComplaintStatus getStatus() { return status; }
    public String getResolutionRemarks() { return resolutionRemarks; }
    public Instant getCreatedAt() { return createdAt; }
    public Instant getUpdatedAt() { return updatedAt; }
    public User getStudent() { return student; }
}
