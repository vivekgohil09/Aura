FROM maven:3.9.11-eclipse-temurin-21 AS build

WORKDIR /app

COPY pom.xml .

RUN mvn dependency:go-offline -B

COPY src ./src

RUN mvn clean package -DskipTests


FROM eclipse-temurin:21-jre-alpine

WORKDIR /app

RUN apk add --no-cache nginx

COPY --from=build /app/target/*.jar app.jar

COPY nginx.conf /etc/nginx/http.d/default.conf
COPY start.sh /start.sh

RUN chmod +x /start.sh

EXPOSE 10000

ENTRYPOINT ["/start.sh"]