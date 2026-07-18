namespace FlowSpace.Domain.Enums
{
    public enum RequestType
    {
        Leave,
        Overtime,
        Purchase,
        Remote
    }

    public enum RequestStatus
    {
        Pending,
        Approved,
        Rejected
    }

    public enum ApprovalStatus
    {
        Pending,
        Approved,
        Rejected
    }
}
