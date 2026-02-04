package com.kookee.sales.config;

import com.kookee.sales.entity.Role;
import com.kookee.sales.entity.User;
import com.kookee.sales.repository.RoleRepository;
import com.kookee.sales.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.boot.CommandLineRunner;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.security.crypto.password.PasswordEncoder;

@Configuration
@RequiredArgsConstructor
public class DataSeeder {

    private final RoleRepository roleRepository;
    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;

    @Bean
    public CommandLineRunner initData() {
        return args -> {
            Role adminRole = createRolePostIfNotFound("ADMIN", "Administrator with full access");
            Role repRole = createRolePostIfNotFound("FIELD_SALES_REP", "Field Sales Representative");
            createRolePostIfNotFound("SUPER_ADMIN", "Super Administrator");

            createUserIfNotFound("admin", "admin123", "Admin User", adminRole);
            createUserIfNotFound("rep1", "rep123", "John Doe", repRole);
        };
    }

    private Role createRolePostIfNotFound(String name, String description) {
        return roleRepository.findByName(name).orElseGet(() -> {
            Role role = Role.builder()
                    .name(name)
                    .description(description)
                    .build();
            return roleRepository.save(role);
        });
    }

    private void createUserIfNotFound(String username, String password, String fullName, Role role) {
        if (!userRepository.existsByUsername(username)) {
            User user = User.builder()
                    .username(username)
                    .passwordHash(passwordEncoder.encode(password))
                    .fullName(fullName)
                    .role(role)
                    .isActive(true)
                    .build();
            userRepository.save(user);
        }
    }
}
