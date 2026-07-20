using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;
using AutoMapper;
using FlowSpace.Application.Common.Dtos;
using FlowSpace.Application.Interfaces;
using FlowSpace.Application.Services;
using FlowSpace.Domain.Entities;
using FlowSpace.Domain.Interfaces;
using Moq;
using Xunit;

namespace FlowSpace.Application.UnitTests.Projects
{
    public class ProjectServiceTests
    {
        private readonly Mock<IUnitOfWork> _mockUnitOfWork;
        private readonly Mock<IMapper> _mockMapper;
        private readonly Mock<IGenericRepository<Project>> _mockRepo;
        private readonly IProjectService _projectService;

        public ProjectServiceTests()
        {
            _mockUnitOfWork = new Mock<IUnitOfWork>();
            _mockMapper = new Mock<IMapper>();
            _mockRepo = new Mock<IGenericRepository<Project>>();

            _mockUnitOfWork.Setup(u => u.Repository<Project>()).Returns(_mockRepo.Object);
            _projectService = new ProjectService(_mockUnitOfWork.Object, _mockMapper.Object);
        }

        [Fact]
        public async Task GetAllProjectsAsync_ShouldReturnProjectResponses()
        {
            // Arrange
            var projects = new List<Project>
            {
                new Project { Id = Guid.NewGuid(), Code = "P-01", Name = "Project 1" }
            };

            var responses = new List<ProjectResponse>
            {
                new ProjectResponse { Id = projects[0].Id, Code = "P-01", Name = "Project 1" }
            };

            _mockRepo.Setup(r => r.GetAllAsync()).ReturnsAsync(projects);
            _mockMapper.Setup(m => m.Map<IEnumerable<ProjectResponse>>(It.IsAny<IEnumerable<Project>>()))
                       .Returns(responses);

            // Act
            var result = await _projectService.GetAllProjectsAsync();

            // Assert
            Assert.NotNull(result);
            Assert.Single(result);
            Assert.Equal("P-01", result.First().Code);
        }

        [Fact]
        public async Task GetProjectByIdAsync_WhenProjectDoesNotExist_ShouldReturnNull()
        {
            // Arrange
            var projectId = Guid.NewGuid();
            _mockRepo.Setup(r => r.GetByIdAsync(projectId)).ReturnsAsync((Project?)null);

            // Act
            var result = await _projectService.GetProjectByIdAsync(projectId);

            // Assert
            Assert.Null(result);
        }
    }
}
