#\!/bin/bash
set -e

echo "=== Testing Custom Variables Feature ==="

# Create a simple template
mkdir -p lib/breakdown/prompts/to/project
cat > lib/breakdown/prompts/to/project/f_project.md << 'TEMPLATE'
# {project_name} Project Plan

Company: {company_name}
Tech Stack: {tech_stack}
Team Size: {team_size}
Deadline: {deadline}
Budget: {budget}

## Input Content
{input_text}
TEMPLATE

# Test with custom variables
echo "Test input content" | breakdown to project \
  --uv-company_name="テックコーポレーション" \
  --uv-project_name="ECサイトリニューアル" \
  --uv-tech_stack="Next.js, TypeScript, Prisma" \
  --uv-team_size="5名" \
  --uv-deadline="2024年3月末" \
  --uv-budget="500万円" \
  -o=output/custom_variables/test_output.md

# Check if output was created
if [ -f "output/custom_variables/test_output.md" ]; then
    echo "✅ Output file created successfully"
    echo "=== Output Content ==="
    cat output/custom_variables/test_output.md
else
    echo "❌ Output file not created"
fi
