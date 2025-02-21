using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;

namespace ChoreTrackerAPI.Dtos
{
    public class GroupCreateRequest
    {
        public string Name {get;set;}
        public List<string> MemberEmails {get;set;}
    }
}