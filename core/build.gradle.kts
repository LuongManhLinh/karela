plugins {
    id("java")
    id("org.springframework.boot") version "3.5.4"
    id("io.spring.dependency-management") version "1.1.7"
}

group = "io.ratsnake"
version = "1.0-SNAPSHOT"

repositories {
    mavenCentral()
    maven {
        name = "atlassian-public"
        url = uri("https://maven.atlassian.com/repository/public")
        mavenContent {
            // This repository contains both releases and snapshots
            releasesOnly() // or snapshotsOnly() if you want to restrict
        }
        metadataSources {
            mavenPom()
            artifact()
        }
    }
}

tasks.withType<JavaCompile> {
    options.compilerArgs.add("-parameters")
}

dependencies {
    implementation("org.springframework.boot:spring-boot-starter-web")
//    implementation("org.springframework.boot:spring-boot-starter-data-jpa")
//	implementation("org.springframework.boot:spring-boot-starter-oauth2-client")
//	implementation("org.springframework.boot:spring-boot-starter-security")
    implementation("org.springframework.boot:spring-boot-starter-validation")

    implementation("dev.langchain4j:langchain4j:1.3.0")
    implementation("dev.langchain4j:langchain4j-google-ai-gemini:1.3.0")
    implementation("dev.langchain4j:langchain4j-core:1.3.0")

    // LangGraph4j core
    implementation("org.bsc.langgraph4j:langgraph4j-core:1.6.0")
    implementation("org.bsc.langgraph4j:langgraph4j-langchain4j:1.6.0")

    implementation("com.mysql:mysql-connector-j:9.2.0")
    runtimeOnly("com.mysql:mysql-connector-j")

    compileOnly("org.projectlombok:lombok")
    annotationProcessor("org.projectlombok:lombok")


    implementation("com.squareup.okhttp3:okhttp:5.1.0")
    implementation("com.squareup.retrofit2:retrofit:3.0.0")
    implementation("com.squareup.retrofit2:converter-gson:3.0.0")
    implementation("com.squareup.retrofit2:converter-jackson:3.0.0")

    implementation("com.atlassian.adf:adf-builder-java:1.1.0")
    implementation("com.atlassian.adf:adf-builder-java-markdown:1.1.0")
//    implementation("com.atlassian.adf:adf-builder-java-jackson2:1.1.0") // if parsing JSON


    testImplementation(platform("org.junit:junit-bom:5.10.0"))
    testImplementation("org.junit.jupiter:junit-jupiter")
    testRuntimeOnly("org.junit.platform:junit-platform-launcher")
    testImplementation("io.cucumber:cucumber-java:7.23.0")
    testImplementation("io.cucumber:cucumber-junit:7.23.0")
    implementation(kotlin("stdlib-jdk8"))
}

tasks.test {
    useJUnitPlatform()
}