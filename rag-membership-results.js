(() => {
  const observedBudgetResults = Array.from({ length: 11 }, (_, queryCount) => ({
    queryCount,
    candidateCount: queryCount,
    memberCount: Math.ceil(queryCount / 2),
    nonmemberCount: Math.floor(queryCount / 2),
    rocAuc: queryCount < 2 ? null : 1.0,
    accuracyAtHalf: queryCount === 0 ? null : 1.0,
    meanMemberScore: queryCount === 0 ? null : 1.0,
    meanNonmemberScore: queryCount < 2 ? null : 0.0,
  }));

  window.__RAG_MEMBERSHIP_RESULTS__ = {
    schemaVersion: 2,
    selectionProtocol: "one generated answer per candidate; member and nonmember candidates alternate by candidate id",
    results: [
      {
        productCode: "030701",
        candidateCount: 40,
        memberCount: 20,
        nonmemberCount: 20,
        queryCount: 80,
        queriesPerCandidate: 2,
        rocAuc: 1.0,
        accuracyAtHalf: 1.0,
        meanMemberScore: 1.0,
        meanNonmemberScore: 0.0,
        scoreSource: "chatbot_answer_text_only",
        budgetResults: observedBudgetResults,
      },
      {
        productCode: "030705",
        candidateCount: 24,
        memberCount: 12,
        nonmemberCount: 12,
        queryCount: 48,
        queriesPerCandidate: 2,
        rocAuc: 1.0,
        accuracyAtHalf: 1.0,
        meanMemberScore: 1.0,
        meanNonmemberScore: 0.0,
        scoreSource: "chatbot_answer_text_only",
        budgetResults: observedBudgetResults,
      },
    ],
  };
})();
