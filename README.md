# I Have Never Ever - Simple Game

This project is a simple 'Never Have I Ever' anonymous game that you can play with your friends

## Getting Started

To use this application you have to have Java 25 installed on your local machine

### Run it

If you want just to run the application, simply download `ihne.jar` from `release` folder. 
Then open terminal in the folder with this jar and type:

For Windows, Linux and MacOS (for MacOS you have to run it with sudo)

```
$ java -jar ihne.jar
```

### Playing

To use application you should run it in some local network, and give IP address or host name of the host machine to people you're playing with.
In this example I will use `localhost` instead of it.

Give link to this page to all the people, one of them can create room and others will connect to it by the code, then they can ask questions until the host (who created the room) hits "Start play" and questions are shown in random order to him.

```
http://localhost/
```

## Building

You can build the application by running:

		$ ./gradlew build

To assemble new jar (that will appear in the `release` folder use this:

		$ ./gradlew bootJar

You can launch the application by running:

		$ ./gradlew bootRun


Also you can build and run using IntelliJ IDEA  Spring Boot plugin.

This project uses `kotlin-spring` plugin to avoid requiring `open` modifier on proxified
classes and methods, see [this blog post](https://blog.jetbrains.com/kotlin/2016/12/kotlin-1-0-6-is-here/) for more details.
This project uses a [Kotlin based Gradle](https://github.com/gradle/kotlin-dsl) configuration.

## API

#### To create a room:
```
POST http://localhost/api/v1/room
```
**Response**
```
{
    "code": Int
}
```

#### To get the room (check if it exists since rooms are auto-deleted 24h since last asked question):
```
GET http://localhost/api/v1/room/{code}
```
**Response**
```
200 OK - room exists
404 Not Found - there is no such room
```

#### To get the number of not shown questions in the room:
```
GET http://localhost/api/v1/room/{code}/notShownCount
```
**Response**
```
Long /* count of questions not shown in the room. */
```
```
200 OK - room exists
404 Not Found - there is no such room
```

#### To load a number of questions from predefined dataset into the room:
```
POST http://localhost/api/v1/room/{code}/load
{
    "size": Int,
    "datasetName": String /* values: common, horny */
}
```
**Response**
```
Long /* count of questions added to the room. Identical questions are not added so 0 means you already have all questions from this dataset in the room */
```

#### To upload your own dataset of questions into the room:
```
POST http://localhost/api/v1/room/{code}/upload

form-data
file: yourFile.txt

/* every question from new line */
```
**Response**
```
Long /* count of questions added to the room. Identical questions are not added so 0 means you already have all questions from this dataset in the room */
```

#### To add question into the room:
```
POST http://localhost/api/v1/room/{code}/questions
{
    "question": String
}
```
**Response**
```
200 OK - question added
400 Conflict - such exact question already exist in this room
```

#### To get random question from the room:
```
GET http://localhost/api/v1/room/{code}/questions/random
```
**Response**
```
{
    "question": String
}
```

#### To download all questions from the room (only when all the questions in the room were shown):
```
GET http://localhost/api/v1/room/{code}/questions/download
```
**Response**
```
200 OK - You receive file (ByteArray to download)
405 Method Not Allowed - not all questions were shown in this room. Play a game first.
```


## Built With
 - Kotlin 2.2.10
 - Spring Boot 4.0.0
 - Spring WebFlux Reactive web server and client
 - [Spring Kotlin support](https://spring.io/blog/2017/01/04/introducing-kotlin-support-in-spring-framework-5-0)
 - Reactor Kotlin
 - [Gradle Kotlin DSL](https://github.com/gradle/kotlin-dsl)
 - h2(local), PostgreSQL/MySQL(prod, selectable)
 - Thymeleaf
