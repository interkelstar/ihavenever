plugins {
    val kotlinVersion = "1.4.10"

    java
    idea

    kotlin("jvm") version kotlinVersion
    kotlin("plugin.spring") version kotlinVersion
    kotlin("plugin.jpa") version kotlinVersion

    id("org.springframework.boot") version "2.7.0"
    id("io.spring.dependency-management") version "1.1.0"
    id("com.google.cloud.tools.appengine") version "2.4.1"
}

group = "com.kelstar"
version = "1.0"

java {
    sourceCompatibility = JavaVersion.VERSION_11
}

tasks {
    compileKotlin {
        kotlinOptions {
            jvmTarget = "11"
            languageVersion = "1.4"
        }
    }
    bootJar {
        destinationDirectory.set(File("./release"))
        archiveFileName.set("ihne.jar")
    }
    test {
        useJUnitPlatform()
    }
}

appengine {
    deploy {
        projectId = "ihne-294517"
        version = "1"
        stopPreviousVersion = true
        promote = true
    }
}


repositories {
    mavenCentral()
    maven (  "https://repo.spring.io/snapshot" )
    maven (  "https://repo.spring.io/milestone" )
}

dependencies {
    implementation(kotlin("stdlib-jdk8"))
    implementation(kotlin("stdlib"))
    implementation(kotlin("reflect"))

    implementation("org.springframework.boot:spring-boot-starter-actuator")
    implementation("org.springframework.boot:spring-boot-starter-data-jpa")
    implementation("org.springframework.boot:spring-boot-starter-validation")
    implementation("org.springframework.boot:spring-boot-starter-thymeleaf")
    implementation("org.springframework.boot:spring-boot-starter-security")
    implementation("org.springframework.boot:spring-boot-starter-webflux")
    implementation("org.springframework.boot:spring-boot-starter-web")
    developmentOnly("org.springframework.boot:spring-boot-devtools")

    implementation("com.fasterxml.jackson.module:jackson-module-kotlin:2.12.7")
    implementation("io.projectreactor.kotlin:reactor-kotlin-extensions")
    implementation("com.opencsv:opencsv:5.3")
    implementation("net.javacrumbs.shedlock:shedlock-spring:4.44.0")
    implementation("net.javacrumbs.shedlock:shedlock-provider-jdbc-template:4.44.0")

    runtimeOnly("com.h2database:h2")
    runtimeOnly("mysql:mysql-connector-java")
    runtimeOnly("org.postgresql:postgresql")

    testImplementation("org.springframework.boot:spring-boot-starter-test") {
        exclude(module = "junit-vintage-engine")
    }
    testImplementation("io.projectreactor:reactor-test")

}
