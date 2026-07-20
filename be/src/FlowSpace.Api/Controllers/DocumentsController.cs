using System;
using System.IO;
using System.Security.Claims;
using System.Threading.Tasks;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using FlowSpace.Application.Common.Dtos;
using FlowSpace.Persistence.Contexts;
using FlowSpace.Domain.Entities;

namespace FlowSpace.Api.Controllers
{
    [Authorize]
    [Route("api/v1/documents")]
    public class DocumentsController : BaseApiController
    {
        private readonly FlowSpaceDbContext _context;

        public DocumentsController(FlowSpaceDbContext context)
        {
            _context = context;
        }

        [HttpPost("upload")]
        public async Task<ActionResult<ApiResponse<object>>> UploadFile(IFormFile file)
        {
            if (file == null || file.Length == 0)
            {
                return FailResponse<object>("No file uploaded.", StatusCodes.Status400BadRequest);
            }

            // Giới hạn dung lượng file tối đa 5MB trong database tạm thời
            if (file.Length > 5 * 1024 * 1024)
            {
                return FailResponse<object>("File size exceeds the 5MB limit for binary storage.", StatusCodes.Status400BadRequest);
            }

            var userIdString = User.FindFirstValue(ClaimTypes.NameIdentifier);
            var createdBy = Guid.Empty;
            if (!string.IsNullOrEmpty(userIdString) && Guid.TryParse(userIdString, out var parsedId))
            {
                createdBy = parsedId;
            }

            byte[] fileBytes;
            using (var memoryStream = new MemoryStream())
            {
                await file.CopyToAsync(memoryStream);
                fileBytes = memoryStream.ToArray();
            }

            var documentId = Guid.NewGuid();
            var relativePath = $"/api/v1/documents/file/{documentId}"; // API endpoint tải file thay thế cho physical URL

            var document = new Document
            {
                Id = documentId,
                Name = file.FileName,
                Size = file.Length,
                Type = file.ContentType,
                Url = relativePath,
                ContentData = fileBytes,
                ContentType = file.ContentType,
                CreatedBy = createdBy,
                CreatedAt = DateTime.UtcNow
            };

            await _context.Documents.AddAsync(document);
            await _context.SaveChangesAsync();

            var result = new
            {
                id = document.Id,
                name = document.Name,
                size = document.Size,
                type = document.Type,
                url = document.Url,
                uploadedAt = document.CreatedAt
            };

            return OkResponse<object>(result, "File uploaded successfully to Database.");
        }

        [AllowAnonymous]
        [HttpGet("file/{id}")]
        public async Task<IActionResult> GetFile(Guid id)
        {
            var document = await _context.Documents.FirstOrDefaultAsync(d => d.Id == id);
            if (document == null || document.ContentData == null)
            {
                return NotFound("File not found.");
            }

            return File(document.ContentData, document.ContentType ?? "application/octet-stream", document.Name);
        }

        [HttpGet]
        public async Task<ActionResult<ApiResponse<object>>> GetAll()
        {
            var documents = await _context.Documents
                .Select(d => new
                {
                    id = d.Id,
                    name = d.Name,
                    size = d.Size,
                    type = d.Type,
                    url = d.Url,
                    uploadedAt = d.CreatedAt,
                    createdBy = d.CreatedBy
                })
                .OrderByDescending(d => d.uploadedAt)
                .ToListAsync();

            return OkResponse<object>(documents, "Documents retrieved successfully.");
        }

        [HttpGet("{id:guid}")]
        public async Task<ActionResult<ApiResponse<object>>> GetById(Guid id)
        {
            var document = await _context.Documents.FirstOrDefaultAsync(d => d.Id == id);
            if (document == null)
            {
                return FailResponse<object>("Document not found.", StatusCodes.Status404NotFound);
            }

            var result = new
            {
                id = document.Id,
                name = document.Name,
                size = document.Size,
                type = document.Type,
                url = document.Url,
                uploadedAt = document.CreatedAt,
                createdBy = document.CreatedBy
            };

            return OkResponse<object>(result, "Document metadata retrieved successfully.");
        }

        [HttpPut("{id:guid}")]
        public async Task<ActionResult<ApiResponse<object>>> Update(Guid id, [FromBody] UpdateDocumentRequest request)
        {
            var document = await _context.Documents.FirstOrDefaultAsync(d => d.Id == id);
            if (document == null)
            {
                return FailResponse<object>("Document not found.", StatusCodes.Status404NotFound);
            }

            if (string.IsNullOrWhiteSpace(request.Name))
            {
                return FailResponse<object>("Document name is required.", StatusCodes.Status400BadRequest);
            }

            document.Name = request.Name;
            _context.Documents.Update(document);
            await _context.SaveChangesAsync();

            var result = new
            {
                id = document.Id,
                name = document.Name,
                size = document.Size,
                type = document.Type,
                url = document.Url,
                uploadedAt = document.CreatedAt,
                createdBy = document.CreatedBy
            };

            return OkResponse<object>(result, "Document updated successfully.");
        }

        [HttpDelete("{id:guid}")]
        public async Task<ActionResult<ApiResponse<string>>> Delete(Guid id)
        {
            var document = await _context.Documents.FirstOrDefaultAsync(d => d.Id == id);
            if (document == null)
            {
                return FailResponse<string>("Document not found.", StatusCodes.Status404NotFound);
            }

            _context.Documents.Remove(document);
            await _context.SaveChangesAsync();

            return OkResponse("Document deleted successfully.");
        }
    }

    public class UpdateDocumentRequest
    {
        public string Name { get; set; } = string.Empty;
    }
}
