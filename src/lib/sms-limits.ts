/** Length caps shared by the SMS forms and the actions (the actions check them again on the server). */
export const smsLimits = { apiKey: 500, lineNumber: 40, text: 500, phones: 2000 } as const;
