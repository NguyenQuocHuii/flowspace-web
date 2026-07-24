using System;
using System.Collections.Generic;
using FlowSpace.Domain.Entities;
using FlowSpace.Application.Services;
using Xunit;

namespace FlowSpace.Application.Tests
{
    public class GanttCycleDetectionTests
    {
        [Fact]
        public void SelfLink_ShouldReturnCycleTrue()
        {
            var taskId = Guid.NewGuid();
            var links = new List<TaskDependency>();

            bool isCycle = GanttService.HasCycle(taskId, taskId, links);

            Assert.True(isCycle, "Self-link must be detected as cycle.");
        }

        [Fact]
        public void DirectCycle_AB_and_BA_ShouldReturnCycleTrue()
        {
            var taskA = Guid.NewGuid();
            var taskB = Guid.NewGuid();

            var links = new List<TaskDependency>
            {
                new TaskDependency { PredecessorId = taskA, SuccessorId = taskB } // A -> B
            };

            // Try creating B -> A
            bool isCycle = GanttService.HasCycle(taskB, taskA, links);

            Assert.True(isCycle, "Creating B -> A when A -> B exists must return cycle true.");
        }

        [Fact]
        public void TransitiveCycle_ABC_and_CA_ShouldReturnCycleTrue()
        {
            var taskA = Guid.NewGuid();
            var taskB = Guid.NewGuid();
            var taskC = Guid.NewGuid();

            var links = new List<TaskDependency>
            {
                new TaskDependency { PredecessorId = taskA, SuccessorId = taskB }, // A -> B
                new TaskDependency { PredecessorId = taskB, SuccessorId = taskC }  // B -> C
            };

            // Try creating C -> A (Creates A -> B -> C -> A cycle)
            bool isCycle = GanttService.HasCycle(taskC, taskA, links);

            Assert.True(isCycle, "Creating C -> A when A -> B -> C exists must return cycle true.");
        }

        [Fact]
        public void ParallelValidBranch_ShouldReturnCycleFalse()
        {
            var taskA = Guid.NewGuid();
            var taskB = Guid.NewGuid();
            var taskC = Guid.NewGuid();
            var taskD = Guid.NewGuid();

            var links = new List<TaskDependency>
            {
                new TaskDependency { PredecessorId = taskA, SuccessorId = taskB }, // A -> B
                new TaskDependency { PredecessorId = taskA, SuccessorId = taskC }  // A -> C
            };

            // Try creating B -> D (Valid parallel branch)
            bool isCycle = GanttService.HasCycle(taskB, taskD, links);

            Assert.False(isCycle, "Creating B -> D on parallel branch must be valid (no cycle).");
        }
    }
}
