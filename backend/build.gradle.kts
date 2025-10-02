plugins {
    java
    id("com.github.johnrengelman.shadow") version "8.1.1"
}

java { toolchain { languageVersion.set(JavaLanguageVersion.of(21)) } }

group = "app"
version = "0.1.0"

repositories { mavenCentral() }

dependencies {
    implementation("com.amazonaws:aws-java-sdk-dynamodb:1.12.744")
    implementation("software.amazon.awssdk:dynamodb-enhanced:2.25.61")
    implementation("software.amazon.awssdk:auth:2.25.61")
    implementation("software.amazon.awssdk:regions:2.25.61")

    implementation("com.google.dagger:dagger:2.51.1")
    annotationProcessor("com.google.dagger:dagger-compiler:2.51.1")

    implementation("com.fasterxml.jackson.core:jackson-databind:2.17.2")

    implementation("software.amazon.lambda:powertools-logging:1.18.0")

    implementation("com.amazonaws:aws-lambda-java-core:1.2.3")
    implementation("com.amazonaws:aws-lambda-java-events:3.14.0")
}

tasks.withType<Jar> {
    manifest { attributes["Main-Class"] = "app.handlers.RouterHandler" }
}

tasks.test { useJUnitPlatform() }