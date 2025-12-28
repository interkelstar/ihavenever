plugins {
    val kotlinVersion = "2.3.0"

    java
    idea

    kotlin("jvm") version kotlinVersion
    kotlin("plugin.spring") version kotlinVersion
    kotlin("plugin.jpa") version kotlinVersion

    id("org.springframework.boot") version "4.0.0"
    id("io.spring.dependency-management") version "1.1.7"
    id("com.google.cloud.tools.appengine") version "2.8.0"
}

group = "com.kelstar"
version = "1.0"

kotlin {
    jvmToolchain(25)
}

tasks.withType<JavaCompile>().configureEach {
    options.release.set(25)
}

tasks {
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

    implementation("com.fasterxml.jackson.module:jackson-module-kotlin")
    implementation("io.projectreactor.kotlin:reactor-kotlin-extensions")
    implementation("com.opencsv:opencsv:5.9")
    implementation("net.javacrumbs.shedlock:shedlock-spring:7.2.2")
    implementation("net.javacrumbs.shedlock:shedlock-provider-jdbc-template:7.2.2")

    runtimeOnly("com.h2database:h2")
    runtimeOnly("com.mysql:mysql-connector-j")
    runtimeOnly("org.postgresql:postgresql")

    testImplementation("org.springframework.boot:spring-boot-starter-test")
    testImplementation("io.projectreactor:reactor-test")
    testRuntimeOnly("org.junit.platform:junit-platform-launcher")

}
