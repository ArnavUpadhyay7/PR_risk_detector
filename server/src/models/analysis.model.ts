import mongoose, { Schema, type InferSchemaType } from "mongoose";

const analysisSchema = new Schema(
  {
    prUrl: { type: String, required: true },
    repository: { type: String, required: true },
    pullNumber: { type: Number, required: true },
    title: { type: String, required: true },
    analyzedAt: { type: Date, default: Date.now },
    result: { type: Schema.Types.Mixed, required: true },
  },
  { timestamps: false },
);

export type AnalysisDocument = InferSchemaType<typeof analysisSchema>;

export const AnalysisModel =
  mongoose.models.Analysis ?? mongoose.model("Analysis", analysisSchema);

export async function saveAnalysisRecord(data: {
  prUrl: string;
  repository: string;
  pullNumber: number;
  title: string;
  result: object;
}): Promise<void> {
  if (mongoose.connection.readyState !== 1) {
    return;
  }

  try {
    await AnalysisModel.create({
      prUrl: data.prUrl,
      repository: data.repository,
      pullNumber: data.pullNumber,
      title: data.title,
      analyzedAt: new Date(),
      result: data.result,
    });
  } catch (error) {
    console.warn("Failed to persist analysis (non-fatal):", error);
  }
}
