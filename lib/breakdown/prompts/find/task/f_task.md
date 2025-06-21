# Task Discovery Template

## Input
- {input_text_file}
- {input_text}

## Output
- {destination_path}

---

## Task Discovery Framework

### Task Categories
1. **Development Tasks**
   - Feature implementation
   - Bug fixes
   - Code refactoring
   - Technical debt reduction

2. **Testing Tasks**
   - Unit test creation
   - Integration testing
   - Performance testing
   - Security testing

3. **Documentation Tasks**
   - API documentation
   - User guides
   - Technical specifications
   - Process documentation

4. **Infrastructure Tasks**
   - Deployment setup
   - Monitoring configuration
   - Security updates
   - Performance optimization

5. **Research Tasks**
   - Technology evaluation
   - Proof of concepts
   - Feasibility studies
   - Best practice research

### Task Identification Criteria
- **TODO comments** in code
- **FIXME markers** indicating issues
- **Missing implementations** or placeholders
- **Incomplete features** mentioned in docs
- **Performance bottlenecks** identified
- **Security vulnerabilities** discovered
- **Technical debt** accumulation
- **Process improvements** needed

### Task Analysis

#### Priority Assessment
| Priority | Criteria | Timeline |
|----------|----------|----------|
| Critical | Blocking other work | Immediate |
| High | Important for release | This sprint |
| Medium | Valuable improvement | Next sprint |
| Low | Nice to have | Backlog |

#### Effort Estimation
- **Small**: < 1 day
- **Medium**: 1-3 days
- **Large**: 1-2 weeks
- **Extra Large**: > 2 weeks

### Discovery Instructions

1. **Code Analysis**: Scan for TODO, FIXME, HACK comments
2. **Documentation Review**: Identify missing or incomplete sections
3. **Feature Gaps**: Compare requirements with implementation
4. **Quality Issues**: Find areas needing improvement
5. **Process Gaps**: Identify missing workflows or automation
6. **Dependency Analysis**: Check for outdated or problematic dependencies

## Output Format

### Task Report Structure
```markdown
## Task: [Task Title]
- **Category**: [Development/Testing/Documentation/Infrastructure/Research]
- **Priority**: [Critical/High/Medium/Low]
- **Effort**: [Small/Medium/Large/Extra Large]
- **Dependencies**: [List of blocking items]
- **Assignee**: [Suggested team member]

### Description
[Detailed explanation of what needs to be done]

### Acceptance Criteria
- [ ] [Specific deliverable 1]
- [ ] [Specific deliverable 2]
- [ ] [Specific deliverable 3]

### Technical Notes
[Implementation details, constraints, or considerations]

### Definition of Done
- [ ] Implementation complete
- [ ] Tests written and passing
- [ ] Documentation updated
- [ ] Code reviewed
- [ ] Deployed to staging
```

### Task Grouping
- Group related tasks into epics or themes
- Identify task dependencies and ordering
- Suggest sprint or release planning

## Quality Assurance
- Ensure tasks are specific and actionable
- Verify effort estimates are reasonable
- Check for missing dependencies
- Validate acceptance criteria are testable