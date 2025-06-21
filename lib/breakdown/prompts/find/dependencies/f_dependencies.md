# Dependencies Discovery Template

## Input
- {input_text_file}
- {input_text}

## Output
- {destination_path}

---

## Dependency Analysis Framework

### Dependency Types
1. **Code Dependencies**
   - Third-party libraries
   - Internal modules
   - Framework dependencies
   - Development tools

2. **System Dependencies**
   - Operating system requirements
   - Runtime environments
   - Database systems
   - External services

3. **Build Dependencies**
   - Compilation tools
   - Package managers
   - Build scripts
   - CI/CD tools

4. **Deployment Dependencies**
   - Infrastructure requirements
   - Configuration files
   - Environment variables
   - Service dependencies

### Analysis Perspectives

#### Security Analysis
- **Vulnerability Assessment**: Known CVEs in dependencies
- **License Compliance**: Legal compatibility of licenses
- **Supply Chain Security**: Integrity of dependency sources
- **Access Control**: Dependencies requiring authentication

#### Maintenance Analysis
- **Update Status**: How current are the dependencies
- **Support Status**: Active maintenance and community
- **Breaking Changes**: Potential impact of updates
- **Alternative Options**: Replacement possibilities

#### Performance Analysis
- **Size Impact**: Bundle size and load time effects
- **Runtime Performance**: Execution speed implications
- **Memory Usage**: Resource consumption patterns
- **Compatibility**: Browser and platform support

### Discovery Methods

#### Automated Discovery
- **Package Files**: package.json, requirements.txt, Gemfile
- **Lock Files**: package-lock.json, yarn.lock, poetry.lock
- **Import Analysis**: Static analysis of import statements
- **Dependency Scanners**: Security and compliance tools

#### Manual Review
- **Documentation Review**: Architecture and design docs
- **Code Inspection**: Manual code review for dependencies
- **Configuration Files**: Docker, CI/CD, deployment configs
- **Team Knowledge**: Developer and architect interviews

### Risk Assessment

#### Risk Categories
| Risk Level | Criteria | Examples |
|------------|----------|----------|
| Critical | Unmaintained + Security issues | Deprecated library with CVEs |
| High | Major version behind | jQuery 1.x when 3.x is current |
| Medium | Minor updates available | Patch versions behind |
| Low | Latest version | Up-to-date dependencies |

#### Impact Assessment
- **Development Impact**: Effect on development speed
- **Security Impact**: Vulnerability exposure
- **Performance Impact**: User experience effects
- **Compliance Impact**: Legal and regulatory risks

### Analysis Instructions

1. **Inventory Creation**: List all dependencies with versions
2. **Vulnerability Scanning**: Check for known security issues
3. **License Analysis**: Verify legal compliance
4. **Update Assessment**: Identify outdated dependencies
5. **Alternative Research**: Find replacement options
6. **Risk Prioritization**: Rank by impact and urgency

## Output Format

### Dependency Report Structure
```markdown
## Dependency Analysis Report

### Executive Summary
- **Total Dependencies**: [Number]
- **Critical Issues**: [Count]
- **Security Vulnerabilities**: [Count]
- **License Issues**: [Count]
- **Outdated Dependencies**: [Count]

### Dependency Inventory
| Name | Version | Latest | Type | License | Risk Level |
|------|---------|--------|------|---------|------------|
| [dep1] | [1.0.0] | [2.0.0] | [runtime] | [MIT] | [High] |

### Critical Issues
#### [Dependency Name]
- **Current Version**: [version]
- **Issue**: [security vulnerability/license issue/etc.]
- **Impact**: [description of impact]
- **Recommendation**: [upgrade/replace/remove]
- **Timeline**: [urgency level]

### Security Vulnerabilities
| Dependency | Vulnerability | CVSS Score | Fix Version |
|------------|---------------|------------|-------------|
| [name] | [CVE-2024-xxx] | [9.8] | [2.1.0] |

### License Compliance
| License Type | Count | Compatibility | Issues |
|--------------|-------|---------------|--------|
| MIT | 25 | ✅ Compatible | None |
| GPL | 2 | ⚠️ Copyleft | Review needed |

### Update Recommendations
#### High Priority
- [Dependency]: Update from [old] to [new] (Security fix)
- [Dependency]: Replace with [alternative] (Maintenance)

#### Medium Priority
- [Dependency]: Update from [old] to [new] (Features)
- [Dependency]: Consider [alternative] (Performance)

#### Low Priority
- [Dependency]: Update from [old] to [new] (Minor fixes)

### Maintenance Plan
- **Regular Updates**: Schedule quarterly dependency reviews
- **Security Monitoring**: Set up vulnerability alerts
- **License Tracking**: Monitor license changes
- **Performance Monitoring**: Track bundle size impacts
```

### Automated Tooling
- **Security**: npm audit, snyk, dependabot
- **Updates**: renovate, greenkeeper, dependabot
- **Licenses**: license-checker, fossa
- **Analysis**: dependency-cruiser, depcheck

## Quality Assurance
- Verify all dependencies are accurately identified
- Ensure risk assessments are appropriate
- Check for transitive dependency issues
- Validate update recommendations are safe