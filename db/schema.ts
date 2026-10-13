import { sqliteTable, text, integer, index } from 'drizzle-orm/sqlite-core';
export const visitorSessions = sqliteTable('visitor_sessions', {
  id: text('id').primaryKey(), csrf: text('csrf').notNull(),
  tag: text('tag').notNull(), createdAt: integer('created_at').notNull(),
});
export const answers = sqliteTable('answers', {
  id: text('id').primaryKey(), sessionId: text('session_id').notNull(),
  visitor: text('visitor').notNull(), visitorName: text('visitor_name'), week: integer('week').notNull(),
  questionIndex: integer('question_index').notNull(), question: text('question').notNull(),
  answerType: text('answer_type').notNull(), answer: text('answer').notNull(),
  createdAt: integer('created_at').notNull(),
}, table => [index('answers_created_idx').on(table.createdAt), index('answers_session_idx').on(table.sessionId,table.createdAt)]);

export const inboxSessions = sqliteTable('inbox_sessions', {
  tokenHash: text('token_hash').primaryKey(),
  codeKey: text('code_key').notNull(),
  expiresAt: integer('expires_at').notNull(),
});
export const inboxAttempts = sqliteTable('inbox_attempts', {
  bucket: text('bucket').primaryKey(),
  attempts: integer('attempts').notNull(),
  resetsAt: integer('resets_at').notNull(),
});
