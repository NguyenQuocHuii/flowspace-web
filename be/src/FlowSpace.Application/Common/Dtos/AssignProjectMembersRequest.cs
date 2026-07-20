using System;
using System.Collections.Generic;

namespace FlowSpace.Application.Common.Dtos
{
    public class AssignProjectMembersRequest
    {
        public List<Guid> MemberIds { get; set; } = new List<Guid>();
    }
}
