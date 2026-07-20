using System.Threading.Tasks;

namespace FlowSpace.Application.Interfaces
{
    public interface IEmailSender
    {
        Task SendAsync(string to, string subject, string htmlBody);
    }
}
