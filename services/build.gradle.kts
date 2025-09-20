plugins {
    id("java")
    id("org.springframework.boot") version "3.5.4"
    id("io.spring.dependency-management") version "1.1.7"
}

group = "io.ratsnake"
version = "1.0-SNAPSHOT"

repositories {
    mavenCentral()
}

tasks.withType<JavaCompile> {
    options.compilerArgs.add("-parameters")
}

dependencies {
    implementation("org.springframework.boot:spring-boot-starter-web")
    implementation("org.springframework.boot:spring-boot-starter-data-jpa")
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

    testImplementation(platform("org.junit:junit-bom:5.10.0"))
    testImplementation("org.junit.jupiter:junit-jupiter")
    testRuntimeOnly("org.junit.platform:junit-platform-launcher")
    testImplementation("io.cucumber:cucumber-java:7.23.0")
    testImplementation("io.cucumber:cucumber-junit:7.23.0")
}

tasks.test {
    useJUnitPlatform()
}