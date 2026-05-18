import { describe, it, expect } from "vitest";
import { JiraApiError } from "../errors.js";

describe("JiraApiError.from", () => {
  it("returns the exact error if it is already a JiraApiError", () => {
    const original = new JiraApiError("Already wrapped", 400);
    const result = JiraApiError.from(original);
    expect(result).toBe(original);
  });

  it("extracts multiple errorMessages joined by commas", () => {
    const rawError = {
      response: {
        status: 400,
        data: {
          errorMessages: [
            "The JQL query is invalid.",
            "Field customfield_10013 is not on screen."
          ]
        }
      }
    };
    const result = JiraApiError.from(rawError);
    expect(result.message).toBe("The JQL query is invalid., Field customfield_10013 is not on screen.");
    expect(result.status).toBe(400);
  });

  it("extracts field-specific errors from errors object", () => {
    const rawError = {
      response: {
        status: 400,
        data: {
          errors: {
            customfield_10013: "Field is not on screen",
            assignee: "User does not exist"
          }
        }
      }
    };
    const result = JiraApiError.from(rawError);
    expect(result.message).toBe("customfield_10013: Field is not on screen, assignee: User does not exist");
    expect(result.status).toBe(400);
  });

  it("extracts message from body if it is a simple message string", () => {
    const rawError = {
      response: {
        status: 404,
        data: {
          message: "Issue not found"
        }
      }
    };
    const result = JiraApiError.from(rawError);
    expect(result.message).toBe("Issue not found");
    expect(result.status).toBe(404);
  });

  it("falls back to standard Error message or description", () => {
    const standardError = new Error("Connection timed out");
    const result = JiraApiError.from(standardError);
    expect(result.message).toBe("Connection timed out");
    expect(result.status).toBe(500);

    const descriptionError = { description: "Jira description" };
    const resultDesc = JiraApiError.from(descriptionError);
    expect(resultDesc.message).toBe("Jira description");
    expect(resultDesc.status).toBe(500);
  });

  it("falls back to default message if no info is available", () => {
    const emptyError = {};
    const result = JiraApiError.from(emptyError);
    expect(result.message).toBe("Something went wrong");
    expect(result.status).toBe(500);
  });

  it("extracts details from error.message when it is a JSON string", () => {
    const rawError = {
      message: JSON.stringify({
        code: "ERR_BAD_REQUEST",
        status: 400,
        statusText: "Bad Request",
        errorMessages: ["Invalid request payload. Refer to the REST API documentation and try again."]
      })
    };
    const result = JiraApiError.from(rawError);
    expect(result.message).toBe("Invalid request payload. Refer to the REST API documentation and try again.");
    expect(result.status).toBe(400);
    expect(result.toString()).toContain("JiraApiError: Invalid request payload. Refer to the REST API documentation and try again. (Status: 400)");
  });
});
