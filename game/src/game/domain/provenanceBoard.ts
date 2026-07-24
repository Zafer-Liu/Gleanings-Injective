import type { LongjingEvidence } from "./longjingState";

export type ProvenanceColumnId =
  | "claim"
  | "record"
  | "conflict"
  | "review";

export const PROVENANCE_COLUMNS = Object.freeze([
  { id: "claim" as const, label: "包装上说了什么" },
  { id: "record" as const, label: "记录能证明什么" },
  { id: "conflict" as const, label: "哪里互相矛盾" },
  { id: "review" as const, label: "仍需谁来核查" }
]);

export type ProvenanceCard = {
  id: LongjingEvidence;
  title: string;
  detail: string;
  correctColumn: ProvenanceColumnId;
  success: string;
};

const CARD_BY_ID: Record<LongjingEvidence, ProvenanceCard> = {
  evidence_tin_a: {
    id: "evidence_tin_a",
    title: "罐甲包装声明",
    detail: "包装写有“西湖龙井”与剧情批次编号。",
    correctColumn: "claim",
    success: "它说明包装声称了什么，还不能单独证明产地。"
  },
  evidence_duplicate_batch: {
    id: "evidence_duplicate_batch",
    title: "重复批次编号",
    detail: "两个不同卖家的茶罐使用了同一编号。",
    correctColumn: "conflict",
    success: "不同来源共用编号，是需要继续核查的矛盾。"
  },
  evidence_date_conflict: {
    id: "evidence_date_conflict",
    title: "采制日期矛盾",
    detail: "同一批次分别写着四月三日和四月七日。",
    correctColumn: "conflict",
    success: "同一编号对应两个日期，记录无法同时成立。"
  },
  evidence_flow_record: {
    id: "evidence_flow_record",
    title: "市场流通记录",
    detail: "旧票据指向集散仓，但不能支持包装上的来源声明。",
    correctColumn: "record",
    success: "这是一条可核记录，也暴露出仍然缺失的环节。"
  },
  evidence_old_signature: {
    id: "evidence_old_signature",
    title: "记忆中的旧签样",
    detail: "陈守一曾拒绝为来处不符的原料签名。",
    correctColumn: "review",
    success: "记忆解释人物经历，仍需现代账本和留底互证。"
  },
  evidence_original_batch: {
    id: "evidence_original_batch",
    title: "原始批次账",
    detail: "旧茶坊账本记录的批次范围与茶罐编号不符。",
    correctColumn: "record",
    success: "原始账本为批次范围提供了可核记录。"
  },
  evidence_refusal_copy: {
    id: "evidence_refusal_copy",
    title: "拒签留底",
    detail: "留底版式与后来复用的旧签样一致。",
    correctColumn: "review",
    success: "留底把记忆与现代包装连接起来，仍应提交主管环节核查。"
  }
};

export function cardsForEvidence(
  evidence: readonly LongjingEvidence[]
): ProvenanceCard[] {
  return evidence.map((id) => CARD_BY_ID[id]);
}

export function validateEvidencePlacement(
  cardId: LongjingEvidence,
  column: ProvenanceColumnId
): { correct: boolean; feedback: string } {
  const card = CARD_BY_ID[cardId];
  if (card.correctColumn === column) {
    return { correct: true, feedback: card.success };
  }
  if (cardId === "evidence_tin_a" && column === "record") {
    return {
      correct: false,
      feedback: "包装声明本身不能证明包装声明。"
    };
  }
  if (
    cardId === "evidence_old_signature" &&
    column === "record"
  ) {
    return {
      correct: false,
      feedback: "记忆说明了人物经历，但还需要现代记录互证。"
    };
  }
  return {
    correct: false,
    feedback: "先判断这张卡是在提出声明、留下记录、暴露矛盾，还是等待进一步核查。"
  };
}
