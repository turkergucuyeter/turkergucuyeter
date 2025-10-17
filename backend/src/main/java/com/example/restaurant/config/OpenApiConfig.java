package com.example.restaurant.config;

import io.swagger.v3.oas.models.ExternalDocumentation;
import io.swagger.v3.oas.models.OpenAPI;
import io.swagger.v3.oas.models.info.Info;
import io.swagger.v3.oas.models.info.License;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

@Configuration
public class OpenApiConfig {

    @Bean
    public OpenAPI restaurantPlatformOpenAPI() {
        return new OpenAPI()
                .info(new Info().title("Restaurant Platform API")
                        .description("Comprehensive API for restaurant management, ordering and payments")
                        .version("v0.1.0")
                        .license(new License().name("Apache 2.0").url("https://www.apache.org/licenses/LICENSE-2.0")))
                .externalDocs(new ExternalDocumentation()
                        .description("Project roadmap")
                        .url("../docs/project_plan.md"));
    }
}
