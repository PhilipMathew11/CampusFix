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

import java.time.Instant;

@Entity
@Table(name = "status_history")
public class StatusHistory {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "complaint_id", nullable = false)
    private Complaint complaint;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 24)
    private ComplaintStatus status;

    @Column(length = 2000)
    private String remarks;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "changed_by", nullable = false)
    private User changedBy;

    @Column(nullable = false, updatable = false)
    private Instant changedAt;

    protected StatusHistory() {
    }

    public StatusHistory(Complaint complaint, ComplaintStatus status, String remarks, User changedBy) {
        this.complaint = complaint;
        this.status = status;
        this.remarks = remarks;
        this.changedBy = changedBy;
    }

    @PrePersist
    void setChangedAt() {
        changedAt = Instant.now();
    }

    public Long getId() { return id; }
    public Complaint getComplaint() { return complaint; }
    public ComplaintStatus getStatus() { return status; }
    public String getRemarks() { return remarks; }
    public User getChangedBy() { return changedBy; }
    public Instant getChangedAt() { return changedAt; }
}
