using FlowSpace.Application.Common.Dtos;
using FluentValidation;

namespace FlowSpace.Application.Features.Projects.Validators
{
    public class CreateProjectRequestValidator : AbstractValidator<CreateProjectRequest>
    {
        public CreateProjectRequestValidator()
        {
            RuleFor(x => x.Code)
                .NotEmpty().WithMessage("Mã dự án không được để trống.")
                .MaximumLength(20).WithMessage("Mã dự án không quá 20 ký tự.");

            RuleFor(x => x.Name)
                .NotEmpty().WithMessage("Tên dự án không được để trống.")
                .MaximumLength(200).WithMessage("Tên dự án không quá 200 ký tự.");

            RuleFor(x => x.Status)
                .Must(status => status == "active" || status == "on_hold" || status == "done")
                .WithMessage("Trạng thái dự án phải là 'active', 'on_hold' hoặc 'done'.");

            RuleFor(x => x.Priority)
                .Must(prio => prio == "low" || prio == "medium" || prio == "high")
                .WithMessage("Độ ưu tiên dự án phải là 'low', 'medium' hoặc 'high'.");

            RuleFor(x => x.EndDate)
                .GreaterThan(x => x.StartDate)
                .When(x => x.StartDate.HasValue && x.EndDate.HasValue)
                .WithMessage("Ngày kết thúc phải lớn hơn ngày bắt đầu.");
        }
    }

    public class UpdateProjectRequestValidator : AbstractValidator<UpdateProjectRequest>
    {
        public UpdateProjectRequestValidator()
        {
            RuleFor(x => x.Name)
                .NotEmpty().WithMessage("Tên dự án không được để trống.")
                .MaximumLength(200).WithMessage("Tên dự án không quá 200 ký tự.");

            RuleFor(x => x.Status)
                .Must(status => status == "active" || status == "on_hold" || status == "done")
                .WithMessage("Trạng thái dự án phải là 'active', 'on_hold' hoặc 'done'.");

            RuleFor(x => x.Priority)
                .Must(prio => prio == "low" || prio == "medium" || prio == "high")
                .WithMessage("Độ ưu tiên dự án phải là 'low', 'medium' hoặc 'high'.");

            RuleFor(x => x.Progress)
                .InclusiveBetween(0, 100).WithMessage("Tiến độ dự án phải nằm trong khoảng 0 đến 100.");

            RuleFor(x => x.EndDate)
                .GreaterThan(x => x.StartDate)
                .When(x => x.StartDate.HasValue && x.EndDate.HasValue)
                .WithMessage("Ngày kết thúc phải lớn hơn ngày bắt đầu.");
        }
    }
}
