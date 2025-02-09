# TaskProperty

|Property Name| Definitions| examples|
|---|---|---|
|Work Branch| git branch name that task must be. if not specified, stay same branch.| cursor/edinet-api-20250123|
|Prohibited Files| Application files, such as routes.rb, migrations, and config, should never be edited.| `routes.rb`, `migration/*`, `config/*` |

# StepType
|Property Name| Definitions| examples|
|---|---|---|
|Execute Command| Execute the command specified in the `command` column. | `bundle exec rails test` |
|Check Logs| Check the logs to ensure there are no issues, and identify any problems if they exist. | `tail -200 log/development.log` |
|Write Application Code| "Write code that modifies the behavior of the application.| class Edinet ..., def initialize ...|
|Write Test Code| Write appropriate test code for the application code.||
|Write TDD Test Code |Write tests using test-driven development (TDD) based on the specifications.||
|Git Commit| Commit current changes with git messages. | `git commit` |
|Git Commit All | Commit all changes, including those that have not been staged yet. | `git add . ; git commit` |
|Git Push|| `git push` |


各ステップの実行結果を記録するように、result 定義を行う
- 実行した結果得られたメッセージ
- 実行結果を評価して、 success/error を判定する

ex.) 
- step_result
  - code (optional) :
  - message:
  - judgment