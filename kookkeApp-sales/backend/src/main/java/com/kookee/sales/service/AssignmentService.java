package com.kookee.sales.service;

import com.kookee.sales.entity.Assignment;
import com.kookee.sales.entity.Route;
import com.kookee.sales.entity.User;
import com.kookee.sales.repository.AssignmentRepository;
import com.kookee.sales.repository.RouteRepository;
import com.kookee.sales.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.util.List;
import java.util.UUID;

@Service
@RequiredArgsConstructor
public class AssignmentService {

    private final AssignmentRepository assignmentRepository;
    private final UserRepository userRepository;
    private final RouteRepository routeRepository;

    @Transactional
    public Assignment createAssignment(UUID userId, UUID routeId, LocalDate date) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new IllegalArgumentException("User not found"));
        Route route = routeRepository.findById(routeId)
                .orElseThrow(() -> new IllegalArgumentException("Route not found"));

        Assignment assignment = Assignment.builder()
                .user(user)
                .route(route)
                .assignedDate(date)
                .status("PENDING")
                .build();

        return assignmentRepository.save(assignment);
    }

    @Transactional
    public List<Assignment> copyFromYesterday(LocalDate targetDate) {
        LocalDate yesterday = targetDate.minusDays(1);
        List<Assignment> yesterdayAssignments = assignmentRepository.findByAssignedDate(yesterday);

        // This logic copies EVERYONE's assignment from yesterday to today.
        // A more advanced version would check if an assignment already exists for
        // today.

        List<Assignment> newAssignments = yesterdayAssignments.stream()
                .map(old -> Assignment.builder()
                        .user(old.getUser())
                        .route(old.getRoute())
                        .assignedDate(targetDate)
                        .status("PENDING")
                        .notes("Copied from " + yesterday)
                        .build())
                .toList();

        return assignmentRepository.saveAll(newAssignments);
    }

    public List<Assignment> getAssignmentsForDate(LocalDate date) {
        return assignmentRepository.findByAssignedDate(date);
    }
}
