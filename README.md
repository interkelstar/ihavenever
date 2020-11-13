# I Have Never Ever - Simple Game

This project is a simple 'Never Have I Ever' anonymous game that you can play with your friends

## Getting Started

To use this application you have to have Java installed on your local machine

### Run it

If you want just to run the application, simply download `ihne.jar` from `release` folder. 
Then open terminal in the folder with this jar and type:

For Linux and MacOS (for MacOS you have to run it with sudo)

```
$ ./ihne.jar
```
For Windows

```
$ java -jar ihne.jar
```

### Playing

To use application you should run it in some local network, and give IP address or host name of the host machine to people you're playing with.
In this example I will use `localhost` instead of it.

Give link to this page to all the people, they can ask their questions here

```
http://localhost/
```

After decent amount of questions sent, open this link on any device. It will bring random never shown before question

```
http://localhost/ihne
```

Well, in fact that's it! Some people send their questions and one person reads them out loud.
And if you want to mark all the questions as not shown again (refresh their status) open this link

```
http://localhost/questions/secretLink/refresh
```

### Questions  database
There is a database with already prefilled questions. It's located in the `db` folder. 
If you want to use it, move `set.mv.db` file to the `db` folder near `ihne.jar` (file that you are running) and rename it to `database.mv.db`


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

Make sure you have at least IntelliJ IDEA 2017.1 and Kotlin plugin 1.1.x.
This project uses a [Kotlin based Gradle](https://github.com/gradle/kotlin-dsl) configuration.

## API

#### To get list of all questions:
```
GET http://localhost/questions/
```
**Response**
```
{
    "questions": [
        {
            "question": String,
            "wasShown": boolean,
            "id": int
        }
    ]
}
```

#### To get random not shown question
```
GET http://localhost/questions/random
```
**Response**
```
{
    "question": String,
    "wasShown": boolean,
    "id": int
}
```

#### To add new question:
```
POST http://localhost/questions/
```
**Request**
```
{
    "question": String
}
```

#### To mark all questions as not shown:
```
GET http://localhost/secretLink/refresh
```

## Built With
 - Kotlin 1.4
 - Spring Boot 2.2
 - Spring WebFlux Reactive web server and client
 - [Spring Kotlin support](https://spring.io/blog/2017/01/04/introducing-kotlin-support-in-spring-framework-5-0)
 - Reactor Kotlin
 - [Gradle Kotlin DSL](https://github.com/gradle/kotlin-dsl)
 - h2
 - Thymeleaf
