package com.kookee.sales.entity;

import jakarta.persistence.Entity;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.Id;
import jakarta.persistence.Table;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import java.util.UUID;

@Entity
@Table(name = "territories")
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Territory {
    @Id
    @GeneratedValue
    private UUID id;
    private String name;
}
