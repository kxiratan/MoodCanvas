export class SentimentAnalysisError extends Error {
  constructor(message: string, public status: number = 500) {
    super(message);
    this.name = 'SentimentAnalysisError';
  }
}

export class InvalidInputError extends Error {
  public status: number;
  constructor(message: string) {
    super(message);
    this.name = 'InvalidInputError';
    this.status = 400;
  }
}

export class SessionError extends Error {
  constructor(message: string, public status: number = 404) {
    super(message);
    this.name = 'SessionError';
  }
}