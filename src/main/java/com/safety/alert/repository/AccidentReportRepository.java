package com.safety.alert.repository;

import com.safety.alert.model.AccidentReport;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.UUID;

@Repository
public interface AccidentReportRepository extends JpaRepository<AccidentReport, UUID> {
}
