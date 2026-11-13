package com.campusfix.model;

import org.junit.jupiter.api.Test;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertNotNull;

class ComplaintTest {

    @Test
    void newComplaintStartsPendingAndCanBeUpdated() {
        User student = new User("Alex Morgan", "alex@example.edu", "encoded", Role.STUDENT);
        Complaint complaint = new Complaint("Broken lights", "Two lights are out.", "Library", ComplaintCategory.ELECTRICAL,
                Priority.MEDIUM, student);

        assertEquals(ComplaintStatus.PENDING, complaint.getStatus());

        complaint.updateStatus(ComplaintStatus.IN_PROGRESS, "The maintenance team is on it.");

        assertEquals(ComplaintStatus.IN_PROGRESS, complaint.getStatus());
        assertEquals("The maintenance team is on it.", complaint.getResolutionRemarks());
        assertNotNull(complaint.getUpdatedAt());
    }
}
