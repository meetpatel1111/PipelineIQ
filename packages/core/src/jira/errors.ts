export class JiraApiError extends Error {
  override readonly name = "JiraApiError";
  constructor(
    message: string,
    readonly status: number,
    readonly body?: unknown,
  ) {
    super(message);
  }

  static from(error: any): JiraApiError {
    const status = error.status || error.statusCode || 500;
    const body = error.response || error.body;
    
    let message = "Something went wrong";
    if (typeof error.description === "string") {
      message = error.description;
    } else if (typeof error.message === "string") {
      message = error.message;
    }
    
    return new JiraApiError(message, status, body);
  }
}

export class JiraConfigError extends Error {
  override readonly name = "JiraConfigError";
}
