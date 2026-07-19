package com.kelstar.ihne.service

import org.springframework.http.HttpStatus
import org.springframework.web.server.ResponseStatusException

/**
 * Typed exceptions for the room/question domain. Extending [ResponseStatusException] lets
 * these propagate straight out of a controller and have Spring map them to the right HTTP
 * status automatically - no @ControllerAdvice needed (this project doesn't have one) and no
 * matching on exception message strings in the controller layer.
 */
class RoomNotPaidException :
    ResponseStatusException(HttpStatus.PAYMENT_REQUIRED, "Room is not paid")

class AiGenerationDisabledException :
    ResponseStatusException(HttpStatus.SERVICE_UNAVAILABLE, "AI generation is disabled")

class RoomNotFoundException(code: Int) :
    ResponseStatusException(HttpStatus.NOT_FOUND, "Room $code not found")

class QuestionNotFoundException(id: Long) :
    ResponseStatusException(HttpStatus.NOT_FOUND, "Question $id not found")

class GeminiRequestException(message: String) :
    ResponseStatusException(HttpStatus.BAD_GATEWAY, message)
