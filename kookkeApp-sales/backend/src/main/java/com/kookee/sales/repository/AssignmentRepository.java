package com.kookee.sales.repository;

import com.kookee.sales.entity.Assignment;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import java.time.LocalDate;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Repository
public interface AssignmentRepository extends JpaRepository<Assignment, UUID> {
    List<Assignment> findByAssignedDate(LocalDate date);

    Optional<Assignment> findByUserIdAndAssignedDate(UUID userId, LocalDate date);

    List<Assignment> findByAssignedDateAndUserId(LocalDate assignedDate, UUID userId);
}
