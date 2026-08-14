package com.uptimemonitor.worker;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.boot.autoconfigure.domain.EntityScan;
import org.springframework.data.jpa.repository.config.EnableJpaRepositories;
import org.springframework.scheduling.annotation.EnableScheduling;

@SpringBootApplication
@EnableScheduling
@EntityScan("com.uptimemonitor.common.entity")
@EnableJpaRepositories("com.uptimemonitor.common.repository")
public class MonitorWorkerApplication {

    public static void main(String[] args) {
        SpringApplication.run(MonitorWorkerApplication.class, args);
    }
}
