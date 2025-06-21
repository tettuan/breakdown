# Duplicates Discovery Template

## Input
- {input_text_file}
- {input_text}

## Output
- {destination_path}

---

## Duplicate Detection Framework

### Types of Duplicates
1. **Code Duplicates**
   - Copy-pasted code blocks
   - Similar functions with minor variations
   - Repeated logic patterns
   - Redundant utility functions

2. **Data Duplicates**
   - Duplicate records in databases
   - Redundant configuration entries
   - Repeated test data
   - Multiple versions of same files

3. **Documentation Duplicates**
   - Repeated information across documents
   - Outdated copies of specifications
   - Multiple versions of same content
   - Redundant explanations

4. **Process Duplicates**
   - Overlapping workflows
   - Redundant build steps
   - Multiple tools for same purpose
   - Repeated manual processes

### Detection Methods

#### Automated Detection
- **Static Analysis Tools**: Code similarity detection
- **Hash Comparison**: File content matching
- **Database Queries**: Duplicate record identification
- **Text Analysis**: Document similarity measurement

#### Manual Review
- **Code Review**: Human inspection for patterns
- **Documentation Audit**: Content overlap analysis
- **Process Mapping**: Workflow duplication identification
- **Architecture Review**: System redundancy analysis

### Duplicate Analysis

#### Similarity Metrics
| Similarity Level | Characteristics | Action Required |
|-----------------|-----------------|------------------|
| Identical (100%) | Exact copies | Remove immediately |
| Near-identical (90-99%) | Minor differences | Consolidate |
| Highly similar (70-89%) | Structural similarity | Refactor |
| Moderately similar (50-69%) | Pattern similarity | Consider refactoring |
| Low similarity (<50%) | Acceptable variation | Monitor |

#### Impact Assessment
- **Maintenance Burden**: Cost of maintaining duplicates
- **Consistency Risk**: Potential for divergence
- **Bug Propagation**: Risk of same bugs in multiple places
- **Development Efficiency**: Time spent on redundant work

### Root Cause Analysis

#### Common Causes
1. **Copy-Paste Programming**: Quick fixes becoming permanent
2. **Lack of Abstraction**: Not extracting common functionality
3. **Poor Communication**: Teams unknowingly duplicating work
4. **Legacy Systems**: Old duplicates not cleaned up
5. **Time Pressure**: Taking shortcuts under deadlines
6. **Knowledge Gaps**: Not knowing existing solutions exist

### Analysis Instructions

1. **Systematic Scanning**: Use tools to identify potential duplicates
2. **Manual Verification**: Confirm automated findings
3. **Context Analysis**: Understand why duplicates exist
4. **Impact Assessment**: Evaluate cost of maintaining vs. removing
5. **Refactoring Plan**: Design consolidation strategy
6. **Prevention Strategy**: Identify process improvements

## Output Format

### Duplicate Analysis Report
```markdown
## Duplicate Analysis Report

### Executive Summary
- **Total Duplicates Found**: [Number]
- **Code Duplicates**: [Count]
- **Data Duplicates**: [Count]
- **Documentation Duplicates**: [Count]
- **Estimated Maintenance Cost**: [Hours/Effort]

### Code Duplicates
#### High Priority (>90% similarity)
| Location 1 | Location 2 | Similarity | Lines | Recommendation |
|------------|------------|------------|-------|----------------|
| file1.js:10-25 | file2.js:30-45 | 95% | 16 | Extract to utility |

#### Medium Priority (70-89% similarity)
| Location 1 | Location 2 | Similarity | Lines | Recommendation |
|------------|------------|------------|-------|----------------|
| component1.tsx | component2.tsx | 80% | 32 | Create base component |

### Data Duplicates
#### Database Tables
- **users_backup vs users_archive**: 1,250 duplicate records
- **config_dev vs config_staging**: 15 duplicate entries

#### Configuration Files
- **app.json vs app.prod.json**: 80% overlap
- **webpack.config.js duplicates**: 3 similar configs

### Documentation Duplicates
- **README.md vs docs/setup.md**: Installation instructions duplicated
- **API.md vs swagger.yaml**: Endpoint documentation overlap
- **CONTRIBUTING.md duplicates**: Similar guidelines in 3 files

### Refactoring Recommendations

#### Immediate Actions (High Impact, Low Effort)
1. **Extract Utility Functions**
   - Location: [file paths]
   - Estimated Effort: [hours]
   - Benefit: [reduced maintenance, bug fixes]

2. **Consolidate Configuration**
   - Files: [list of config files]
   - Strategy: [inheritance/templating]
   - Estimated Effort: [hours]

#### Medium Term Actions
1. **Refactor Similar Components**
   - Components: [list]
   - Strategy: [base class, composition, hooks]
      - Estimated Effort: [days]

2. **Documentation Consolidation**
   - Documents: [list]
   - Strategy: [single source of truth]
   - Estimated Effort: [hours]

#### Long Term Actions
1. **Architecture Improvements**
   - Area: [system/module]
   - Strategy: [design patterns]
   - Estimated Effort: [weeks]

### Prevention Strategy
- **Code Review Guidelines**: Check for existing solutions
- **Documentation Standards**: Single source of truth principle
- **Developer Training**: DRY principle and refactoring techniques
- **Tooling**: Automated duplicate detection in CI/CD
- **Architecture Reviews**: Regular system design audits

### Success Metrics
- **Duplicate Reduction**: Target 80% reduction in 6 months
- **Maintenance Time**: Reduce by 25%
- **Bug Incidents**: Reduce duplicate-related bugs by 50%
- **Developer Satisfaction**: Survey feedback on code quality
```

### Tooling Recommendations
- **Code**: PMD, SonarQube, jsinspect, simian
- **Files**: fdupes, rdfind, dupeguru
- **Text**: diff, beyond compare, text similarity tools
- **Custom**: Project-specific duplicate detection scripts

## Quality Assurance
- Verify duplicate detection accuracy
- Ensure refactoring recommendations are safe
- Check for false positives in automated detection
- Validate business logic preservation in consolidation