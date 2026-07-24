namespace FlowSpace.Domain.Enums
{
    public enum DependencyType
    {
        FinishToStart, // Default: Predecessor finishes before Successor starts
        StartToStart,  // Predecessor starts before Successor starts
        FinishToFinish, // Predecessor finishes before Successor finishes
        StartToFinish  // Predecessor starts before Successor finishes
    }
}
