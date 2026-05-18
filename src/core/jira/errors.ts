export class JiraApiError extends Error {
  override readonly name = "JiraApiError";
  constructor(
    message: string,
    readonly status: number,
    readonly body?: unknown,
  ) {
    super(message);
    Object.setPrototypeOf(this, JiraApiError.prototype);
  }

  override toString(): string {
    return `${this.name}: ${this.message} (Status: ${this.status})`;
  }

  static from(error: any): JiraApiError {
    if (error instanceof JiraApiError) {
      return error;
    }

    let parsedBody: any = null;
    if (typeof error.message === "string" && error.message.trim().startsWith("{")) {
      try {
        parsedBody = JSON.parse(error.message);
      } catch (e) {
        // ignore
      }
    }

    const status = error.status || error.statusCode || error.response?.status || parsedBody?.status || 500;
    const body = error.response?.data || error.response || error.body || parsedBody;
    
    let message = "";

    if (body && typeof body === "object") {
      if (Array.isArray(body.errorMessages) && body.errorMessages.length > 0) {
        message = body.errorMessages.join(", ");
      } else if (body.errors && typeof body.errors === "object") {
        const specificErrors = Object.entries(body.errors)
          .map(([field, msg]) => `${field}: ${msg}`)
          .join(", ");
        if (specificErrors) {
          message = specificErrors;
        }
      } else if (typeof body.message === "string" && body.message) {
        message = body.message;
      }
    }

    if (!message) {
      if (typeof error.description === "string" && error.description) {
        message = error.description;
      } else if (typeof error.message === "string" && error.message) {
        message = error.message;
      } else {
        message = "Something went wrong";
      }
    }
    
    return new JiraApiError(message, status, body);
  }
}

export class JiraConfigError extends Error {
  override readonly name = "JiraConfigError";
  constructor(message?: string) {
    super(message);
    Object.setPrototypeOf(this, JiraConfigError.prototype);
  }
}
