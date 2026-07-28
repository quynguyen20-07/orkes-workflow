{
  "createTime": 1785212585636,
  "updateTime": 1785232723870,
  "name": "Demo_Workflow",
  "description": "Mock workflow for 3-Stage",
  "version": 1,
  "tasks": [
    {
      "name": "report_generation_notification",
      "taskReferenceName": "report_generation_notification_ref",
      "inputParameters": {
        "http_request": {
          "uri": "${workflow.input.webhook_url}",
          "method": "POST",
          "body": {
            "message": "Stage 1: Performance Report is ready for review!",
            "workflowId": "${workflow.workflowId}",
            "workflowOutput": "${workflow.output}",
            "workflowStatus": "${workflow.status}"
          }
        }
      },
      "type": "HTTP",
      "decisionCases": {},
      "defaultCase": [],
      "forkTasks": [],
      "startDelay": 0,
      "joinOn": [],
      "optional": false,
      "defaultExclusiveJoinTask": [],
      "asyncComplete": false,
      "loopOver": [],
      "onStateChange": {},
      "permissive": false
    },
    {
      "name": "fork",
      "taskReferenceName": "fork_ref",
      "inputParameters": {},
      "type": "FORK_JOIN",
      "decisionCases": {},
      "defaultCase": [],
      "forkTasks": [
        [
          {
            "name": "performance_review",
            "taskReferenceName": "performance_review_ref",
            "inputParameters": {
              "__humanTaskDefinition": {
                "assignmentCompletionStrategy": "LEAVE_OPEN",
                "assignments": [],
                "displayName": "Stage 1 - human task"
              },
              "stage": "Stage 1",
              "action": "Performance Review & Briefing"
            },
            "type": "HUMAN",
            "decisionCases": {},
            "defaultCase": [],
            "forkTasks": [],
            "startDelay": 0,
            "joinOn": [],
            "optional": false,
            "defaultExclusiveJoinTask": [],
            "asyncComplete": false,
            "loopOver": [],
            "onStateChange": {},
            "permissive": false
          }
        ],
        [
          {
            "name": "wait_2",
            "taskReferenceName": "wait_ref_2",
            "inputParameters": {
              "duration": "1 seconds"
            },
            "type": "WAIT",
            "decisionCases": {},
            "defaultCase": [],
            "forkTasks": [],
            "startDelay": 0,
            "joinOn": [],
            "optional": false,
            "defaultExclusiveJoinTask": [],
            "asyncComplete": false,
            "loopOver": [],
            "onStateChange": {},
            "permissive": false
          },
          {
            "name": "http",
            "taskReferenceName": "http_ref",
            "inputParameters": {
              "uri": "https://0gdh8d8s-3000.asse.devtunnels.ms/api/webhook/human-task",
              "method": "POST",
              "accept": "application/json",
              "contentType": "application/json",
              "encode": true,
              "body": {
                "workflowId": "${workflow.workflowId}",
                "taskRefName": "${workflow.input.taskRefName}",
                "taskId": "${performance_review_ref.taskId}"
              }
            },
            "type": "HTTP",
            "decisionCases": {},
            "defaultCase": [],
            "forkTasks": [],
            "startDelay": 0,
            "joinOn": [],
            "optional": false,
            "defaultExclusiveJoinTask": [],
            "asyncComplete": false,
            "loopOver": [],
            "onStateChange": {},
            "permissive": false
          }
        ]
      ],
      "startDelay": 0,
      "joinOn": [],
      "optional": false,
      "defaultExclusiveJoinTask": [],
      "asyncComplete": false,
      "loopOver": [],
      "onStateChange": {},
      "permissive": false
    },
    {
      "name": "join",
      "taskReferenceName": "join_ref",
      "inputParameters": {},
      "type": "JOIN",
      "decisionCases": {},
      "defaultCase": [],
      "forkTasks": [],
      "startDelay": 0,
      "joinOn": [
        "performance_review_ref"
      ],
      "optional": false,
      "defaultExclusiveJoinTask": [],
      "asyncComplete": false,
      "loopOver": [],
      "onStateChange": {},
      "permissive": false
    },
    {
      "name": "submit_rca_rhq",
      "taskReferenceName": "submit_rca_rhq_ref",
      "inputParameters": {},
      "type": "FORK_JOIN",
      "decisionCases": {},
      "defaultCase": [],
      "forkTasks": [
        [
          {
            "name": "fork_2",
            "taskReferenceName": "fork_ref_2",
            "inputParameters": {},
            "type": "FORK_JOIN",
            "decisionCases": {},
            "defaultCase": [],
            "forkTasks": [
              [
                {
                  "name": "human",
                  "taskReferenceName": "submit_rca_lonhq_ref",
                  "inputParameters": {
                    "__humanTaskDefinition": {
                      "assignmentCompletionStrategy": "LEAVE_OPEN",
                      "assignments": [],
                      "displayName": "Submit RCA LONHQ"
                    },
                    "regionCode": "LONHQ",
                    "taskDescription": "RCA and CAPA Formulation for London HQ"
                  },
                  "type": "HUMAN",
                  "decisionCases": {},
                  "defaultCase": [],
                  "forkTasks": [],
                  "startDelay": 0,
                  "joinOn": [],
                  "optional": false,
                  "defaultExclusiveJoinTask": [],
                  "asyncComplete": false,
                  "loopOver": [],
                  "onStateChange": {},
                  "permissive": false
                }
              ],
              [
                {
                  "name": "wait_1",
                  "taskReferenceName": "wait_ref_1",
                  "inputParameters": {
                    "duration": "1 seconds"
                  },
                  "type": "WAIT",
                  "decisionCases": {},
                  "defaultCase": [],
                  "forkTasks": [],
                  "startDelay": 0,
                  "joinOn": [],
                  "optional": false,
                  "defaultExclusiveJoinTask": [],
                  "asyncComplete": false,
                  "loopOver": [],
                  "onStateChange": {},
                  "permissive": false
                },
                {
                  "name": "http_2",
                  "taskReferenceName": "http_ref_2",
                  "inputParameters": {
                    "uri": "https://0gdh8d8s-3000.asse.devtunnels.ms/api/webhook/human-task",
                    "method": "POST",
                    "accept": "application/json",
                    "contentType": "application/json",
                    "encode": true,
                    "body": {
                      "workflowId": "${workflow.workflowId}",
                      "taskRefName": "${workflow.input.taskRefName}",
                      "taskId": "${submit_rca_lonhq_ref.taskId}"
                    }
                  },
                  "type": "HTTP",
                  "decisionCases": {},
                  "defaultCase": [],
                  "forkTasks": [],
                  "startDelay": 0,
                  "joinOn": [],
                  "optional": false,
                  "defaultExclusiveJoinTask": [],
                  "asyncComplete": false,
                  "loopOver": [],
                  "onStateChange": {},
                  "permissive": false
                }
              ]
            ],
            "startDelay": 0,
            "joinOn": [],
            "optional": false,
            "defaultExclusiveJoinTask": [],
            "asyncComplete": false,
            "loopOver": [],
            "onStateChange": {},
            "permissive": false
          },
          {
            "name": "join_2",
            "taskReferenceName": "join_ref_2",
            "inputParameters": {},
            "type": "JOIN",
            "decisionCases": {},
            "defaultCase": [],
            "forkTasks": [],
            "startDelay": 0,
            "joinOn": [],
            "optional": false,
            "defaultExclusiveJoinTask": [],
            "asyncComplete": false,
            "loopOver": [],
            "onStateChange": {},
            "permissive": false
          }
        ],
        [
          {
            "name": "fork_1",
            "taskReferenceName": "fork_ref_1",
            "inputParameters": {},
            "type": "FORK_JOIN",
            "decisionCases": {},
            "defaultCase": [],
            "forkTasks": [
              [
                {
                  "name": "human",
                  "taskReferenceName": "submit_rca_singq_ref",
                  "inputParameters": {
                    "__humanTaskDefinition": {
                      "assignmentCompletionStrategy": "LEAVE_OPEN",
                      "assignments": [],
                      "displayName": "Submit RCA SINGQ"
                    },
                    "regionCode": "SINHQ",
                    "taskDescription": "RCA and CAPA Formulation for Singapore HQ"
                  },
                  "type": "HUMAN",
                  "decisionCases": {},
                  "defaultCase": [],
                  "forkTasks": [],
                  "startDelay": 0,
                  "joinOn": [],
                  "optional": false,
                  "defaultExclusiveJoinTask": [],
                  "asyncComplete": false,
                  "loopOver": [],
                  "onStateChange": {},
                  "permissive": false
                }
              ],
              [
                {
                  "name": "wait",
                  "taskReferenceName": "wait_ref",
                  "inputParameters": {
                    "duration": "1 seconds"
                  },
                  "type": "WAIT",
                  "decisionCases": {},
                  "defaultCase": [],
                  "forkTasks": [],
                  "startDelay": 0,
                  "joinOn": [],
                  "optional": false,
                  "defaultExclusiveJoinTask": [],
                  "asyncComplete": false,
                  "loopOver": [],
                  "onStateChange": {},
                  "permissive": false
                },
                {
                  "name": "http_1",
                  "taskReferenceName": "http_ref_1",
                  "inputParameters": {
                    "uri": "https://0gdh8d8s-3000.asse.devtunnels.ms/api/webhook/human-task",
                    "method": "POST",
                    "accept": "application/json",
                    "contentType": "application/json",
                    "encode": true,
                    "body": {
                      "workflowId": "${workflow.workflowId}",
                      "taskRefName": "${workflow.input.taskRefName}",
                      "taskId": "${submit_rca_singq_ref.taskId}"
                    }
                  },
                  "type": "HTTP",
                  "decisionCases": {},
                  "defaultCase": [],
                  "forkTasks": [],
                  "startDelay": 0,
                  "joinOn": [],
                  "optional": false,
                  "defaultExclusiveJoinTask": [],
                  "asyncComplete": false,
                  "loopOver": [],
                  "onStateChange": {},
                  "permissive": false
                }
              ]
            ],
            "startDelay": 0,
            "joinOn": [],
            "optional": false,
            "defaultExclusiveJoinTask": [],
            "asyncComplete": false,
            "loopOver": [],
            "onStateChange": {},
            "permissive": false
          },
          {
            "name": "join_1",
            "taskReferenceName": "join_ref_1",
            "inputParameters": {},
            "type": "JOIN",
            "decisionCases": {},
            "defaultCase": [],
            "forkTasks": [],
            "startDelay": 0,
            "joinOn": [],
            "optional": false,
            "defaultExclusiveJoinTask": [],
            "asyncComplete": false,
            "loopOver": [],
            "onStateChange": {},
            "permissive": false
          }
        ]
      ],
      "startDelay": 0,
      "joinOn": [],
      "optional": false,
      "defaultExclusiveJoinTask": [],
      "asyncComplete": false,
      "loopOver": [],
      "onStateChange": {},
      "permissive": false
    },
    {
      "name": "join_rhq_all_region",
      "taskReferenceName": "join_rhq_all_region_ref",
      "inputParameters": {},
      "type": "JOIN",
      "decisionCases": {},
      "defaultCase": [],
      "forkTasks": [],
      "startDelay": 0,
      "joinOn": [
        "submit_rca_lonhq_ref"
      ],
      "optional": false,
      "defaultExclusiveJoinTask": [],
      "asyncComplete": false,
      "loopOver": [],
      "onStateChange": {},
      "permissive": false
    },
    {
      "name": "submit_all_stask_and_close",
      "taskReferenceName": "submit_all_stask_and_close_ref",
      "inputParameters": {
        "stage": "Stage 3",
        "action": "Stakeholder Alignment & Final Approval"
      },
      "type": "SIMPLE",
      "decisionCases": {},
      "defaultCase": [],
      "forkTasks": [],
      "startDelay": 0,
      "joinOn": [],
      "optional": false,
      "defaultExclusiveJoinTask": [],
      "asyncComplete": false,
      "loopOver": [],
      "onStateChange": {},
      "permissive": false
    }
  ],
  "inputParameters": [
    "webhook_url"
  ],
  "outputParameters": {},
  "schemaVersion": 2,
  "restartable": true,
  "workflowStatusListenerEnabled": false,
  "ownerEmail": "quy.nguyent.tpv@one-line.com",
  "timeoutPolicy": "ALERT_ONLY",
  "timeoutSeconds": 0,
  "variables": {},
  "inputTemplate": {},
  "enforceSchema": true,
  "metadata": {},
  "maskedFields": []
}
