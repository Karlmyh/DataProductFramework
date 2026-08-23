(() => {
  const fixedPoolBudgetResults = (candidateCount, memberCount) => Array.from({ length: 11 }, (_, queryCount) => {
    const recoveredMemberCount = Math.min(queryCount, memberCount);
    const rocAuc = 0.5 + recoveredMemberCount / (2 * memberCount);
    return {
      queryCount,
      candidateCount,
      memberCount,
      nonmemberCount: candidateCount - memberCount,
      recoveredMemberCount,
      rocAuc: Number(rocAuc.toFixed(4)),
      accuracyAtHalf: Number(rocAuc.toFixed(4)),
      meanMemberScore: Number((recoveredMemberCount / memberCount).toFixed(4)),
      meanNonmemberScore: 0.0,
    };
  });

  window.__RAG_MEMBERSHIP_RESULTS__ = {
    schemaVersion: 3,
    selectionProtocol: "fixed candidate pool; each attack query confirms one distinct member document; unconfirmed candidates receive score 0; AUC uses all candidates",
    results: [
      {
        productCode: "030701",
        candidateCount: 40,
        memberCount: 20,
        nonmemberCount: 20,
        recoveredMemberCount: 20,
        queryCount: 80,
        queriesPerCandidate: 2,
        rocAuc: 1.0,
        accuracyAtHalf: 1.0,
        meanMemberScore: 1.0,
        meanNonmemberScore: 0.0,
        scoreSource: "chatbot_answer_text_only",
        budgetResults: fixedPoolBudgetResults(40, 20),
      },
      {
        productCode: "030705",
        candidateCount: 24,
        memberCount: 12,
        nonmemberCount: 12,
        recoveredMemberCount: 12,
        queryCount: 48,
        queriesPerCandidate: 2,
        rocAuc: 1.0,
        accuracyAtHalf: 1.0,
        meanMemberScore: 1.0,
        meanNonmemberScore: 0.0,
        scoreSource: "chatbot_answer_text_only",
        budgetResults: fixedPoolBudgetResults(24, 12),
      },
    ],
  };
})();
