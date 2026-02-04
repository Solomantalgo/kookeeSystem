package com.kookee.sales.controller;

import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/rep")
public class RepController {

    @GetMapping("/route")
    public String getRoute() {
        return "Route Data - Access Granted";
    }
}
