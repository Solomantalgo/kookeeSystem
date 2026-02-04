package com.kookee.sales.controller;

import com.kookee.sales.entity.Assignment;
import com.kookee.sales.service.AssignmentService;
import lombok.Data;
import lombok.RequiredArgsConstructor;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDate;
import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api/admin/assignments")
@RequiredArgsConstructor
public class AssignmentController {

    private final AssignmentService assignmentService;

    @PostMapping
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<Assignment> createAssignment(@RequestBody AssignmentRequest request) {
        return ResponseEntity.ok(assignmentService.createAssignment(
                request.getUserId(),
                request.getRouteId(),
                request.getDate()));
    }

    @PostMapping("/copy-from-yesterday")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<List<Assignment>> copyFromYesterday(
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate date) {
        return ResponseEntity.ok(assignmentService.copyFromYesterday(date));
    }

    @Data
    public static class AssignmentRequest {
        private UUID userId;
        private UUID routeId;
        private LocalDate date;
    }
}
