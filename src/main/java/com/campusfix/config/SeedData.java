package com.campusfix.config;

import com.campusfix.model.Complaint;
import com.campusfix.model.ComplaintCategory;
import com.campusfix.model.ComplaintStatus;
import com.campusfix.model.Priority;
import com.campusfix.model.Role;
import com.campusfix.model.StatusHistory;
import com.campusfix.model.User;
import com.campusfix.repository.ComplaintRepository;
import com.campusfix.repository.StatusHistoryRepository;
import com.campusfix.repository.UserRepository;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.boot.CommandLineRunner;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.security.crypto.password.PasswordEncoder;

@Configuration
public class SeedData {

    @Bean
    CommandLineRunner seedDatabase(UserRepository users, ComplaintRepository complaints,
                                   StatusHistoryRepository history, PasswordEncoder encoder,
                                   @Value("${app.seed.enabled:true}") boolean seedEnabled) {
        return args -> {
            if (!seedEnabled) {
                return;
            }
            User admin = findOrCreateUser(users, encoder, "Campus Administrator", "admin@campusfix.edu",
                    "Admin@123", Role.ADMIN);
            User student = findOrCreateUser(users, encoder, "Alex Morgan", "student@campusfix.edu",
                    "Student@123", Role.STUDENT);
            if (complaints.count() > 0) {
                return;
            }
            addComplaint(complaints, history, student, admin, "Projector not connecting",
                    "The HDMI connection in our lecture hall keeps cutting out during class.",
                    "Science Building · Room 204", ComplaintCategory.CLASSROOM, Priority.HIGH,
                    ComplaintStatus.IN_PROGRESS, "The AV team is checking the replacement cable.");
            addComplaint(complaints, history, student, admin, "Water fountain leaking",
                    "The water fountain next to the library entrance has been leaking since yesterday.",
                    "Central Library · Ground floor", ComplaintCategory.PLUMBING, Priority.MEDIUM,
                    ComplaintStatus.PENDING, null);
            addComplaint(complaints, history, student, admin, "Slow campus Wi-Fi",
                    "The network is unusually slow in the north study lounge this week.",
                    "North Study Lounge", ComplaintCategory.WIFI, Priority.LOW,
                    ComplaintStatus.RESOLVED, "Access point was restarted and firmware has been updated.");
        };
    }

    private User findOrCreateUser(UserRepository users, PasswordEncoder encoder, String name, String email,
                                  String password, Role role) {
        return users.findByEmail(email).orElseGet(() ->
                users.save(new User(name, email, encoder.encode(password), role)));
    }

    private void addComplaint(ComplaintRepository complaints, StatusHistoryRepository history, User student,
                              User admin, String title, String description, String location,
                              ComplaintCategory category, Priority priority, ComplaintStatus status, String remarks) {
        Complaint complaint = complaints.saveAndFlush(new Complaint(title, description, location, category,
                priority, student));
        complaint.assignComplaintCode();
        if (status != ComplaintStatus.PENDING) {
            complaint.updateStatus(status, remarks);
            complaints.save(complaint);
        }
        history.save(new StatusHistory(complaint, ComplaintStatus.PENDING, "Complaint submitted", student));
        if (status != ComplaintStatus.PENDING) {
            history.save(new StatusHistory(complaint, status, remarks, admin));
        }
    }
}
