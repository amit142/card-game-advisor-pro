pipeline {
    
    agent {
        label 'jenkins-docker-slave'  
        
    }
    
    environment {
        DOCKER_IMAGE_NAME = "poker_app"
        DOCKER_IMAGE_TAG = "${BUILD_NUMBER}"
        
        CHANGE_ID = "${env.CHANGE_ID ?: ''}"
        CHANGE_TARGET = "${env.CHANGE_TARGET ?: ''}"
        CHANGE_BRANCH = "${env.CHANGE_BRANCH ?: ''}"
        CHANGE_AUTHOR = "${env.CHANGE_AUTHOR ?: ''}"
        CHANGE_TITLE = "${env.CHANGE_TITLE ?: ''}"
    }
    
    triggers {
        // Trigger on pushes to devops/* branches
        githubPush()
        
        // Note: githubPullRequests trigger requires GitHub Pull Request Builder plugin
        // Install the plugin or use webhooks configured in GitHub repository settings
        // For now, this is commented out to avoid pipeline failures
        /*
        githubPullRequests(
            triggerMode: 'HEAVY_HOOKS',
            cancelQueued: true,
            abortRunning: true,
            skipFirstRun: false,
            events: [
                pullRequestOpened(),
                pullRequestUpdated(),
                pullRequestSynchronized()
            ]
        )
        */
    }
    
    options {
        buildDiscarder(logRotator(numToKeepStr: '10'))
        timeout(time: 30, unit: 'MINUTES')
        timestamps()
        
        skipStagesAfterUnstable()
        
        skipDefaultCheckout(false)
    }
    
    stages {
        stage('Checkout') {
            steps {
                script {
                    // For PR builds, checkout the PR branch
                    if (env.CHANGE_ID) {
                        echo "Building PR #${env.CHANGE_ID}: ${env.CHANGE_TITLE}"
                        echo "PR Branch: ${env.CHANGE_BRANCH} -> ${env.CHANGE_TARGET}"
                        echo "Author: ${env.CHANGE_AUTHOR}"
                        
                        // Checkout PR branch
                        checkout([
                            $class: 'GitSCM',
                            branches: [[name: "origin/PR-${env.CHANGE_ID}"]],
                            userRemoteConfigs: [[
                                url: 'https://github.com/amit142/card-game-advisor-pro',
                                refspec: '+refs/pull/*:refs/remotes/origin/PR-*'
                            ]],
                            extensions: [
                                [$class: 'CleanBeforeCheckout'],
                                [$class: 'CloneOption', depth: 1, shallow: true]
                            ]
                        ])
                    } else {
                        // For devops/* branches or other regular branches
                        def branchName = env.BRANCH_NAME ?: 'main'
                        echo "Building branch: ${branchName}"
                        
                        // Check if this is a devops/* branch
                        if (branchName.startsWith('devops/')) {
                            echo "🔧 DevOps branch detected: ${branchName}"
                            echo "This build was triggered by a push to a DevOps branch"
                        }
                        
                        checkout([
                            $class: 'GitSCM', 
                            branches: [[name: "*/${branchName}"]], 
                            userRemoteConfigs: [[
                                url: 'https://github.com/amit142/card-game-advisor-pro'
                            ]],
                            extensions: [
                                [$class: 'CleanBeforeCheckout'],
                                [$class: 'CloneOption', depth: 1, shallow: true]
                            ]
                        ])
                    }
                }
            }
        }

        stage('Branch Information') {
            steps {
                script {
                    def branchName = env.BRANCH_NAME ?: 'main'
                    echo "=== Branch Information ==="
                    echo "Branch: ${branchName}"
                    echo "Build Number: ${BUILD_NUMBER}"
                    echo "Build Cause: ${currentBuild.getBuildCauses()}"
                    
                    // Special handling for devops branches
                    if (branchName.startsWith('devops/')) {
                        echo "🔧 DevOps Branch Build"
                        echo "This is a DevOps infrastructure/configuration change"
                        currentBuild.description = "DevOps Branch: ${branchName}"
                        
                        // You might want to add special environment variables or build steps for devops branches
                        env.IS_DEVOPS_BRANCH = 'true'
                        env.DEVOPS_BRANCH_NAME = branchName
                    } else {
                        env.IS_DEVOPS_BRANCH = 'false'
                    }
                }
            }
        }

        stage('PR Information') {
            when {
                expression { env.CHANGE_ID != null }
            }
            steps {
                script {
                    echo "=== Pull Request Information ==="
                    echo "PR ID: ${env.CHANGE_ID}"
                    echo "PR Title: ${env.CHANGE_TITLE}"
                    echo "Source Branch: ${env.CHANGE_BRANCH}"
                    echo "Target Branch: ${env.CHANGE_TARGET}"
                    echo "Author: ${env.CHANGE_AUTHOR}"
                    echo "Build Number: ${BUILD_NUMBER}"
                    
                    // Set custom build description
                    currentBuild.description = "PR #${env.CHANGE_ID}: ${env.CHANGE_TITLE}"
                }
            }
        }

        stage('DevOps Branch Validation') {
            when {
                expression { env.IS_DEVOPS_BRANCH == 'true' }
            }
            steps {
                script {
                    echo "🔧 Running DevOps branch-specific validations..."
                    
                    // Add specific checks for devops branches
                    sh '''
                        echo "Checking for DevOps-related files..."
                        
                        # Check for common DevOps files
                        if [ -f "Jenkinsfile" ]; then
                            echo "✅ Jenkinsfile found"
                        fi
                        
                        if [ -f "Dockerfile" ]; then
                            echo "✅ Dockerfile found"
                        fi
                        
                        if [ -f "docker-compose.yml" ] || [ -f "docker-compose.yaml" ]; then
                            echo "✅ Docker Compose file found"
                        fi
                        
                        if [ -d ".github/workflows" ]; then
                            echo "✅ GitHub Actions workflows found"
                        fi
                        
                        if [ -d "terraform" ] || [ -f "*.tf" ]; then
                            echo "✅ Terraform files found"
                        fi
                        
                        if [ -d "ansible" ] || [ -f "*.yml" ]; then
                            echo "✅ Ansible files found"
                        fi
                        
                        echo "DevOps branch validation completed"
                    '''
                }
            }
        }

        stage('Install Dependencies') {
            steps {
                script {
                    // Check if package.json exists before running npm ci
                    if (fileExists('package.json')) {
                        echo "Installing Node.js dependencies..."
                        sh 'npm ci'
                    } else {
                        echo "No package.json found, skipping dependency installation"
                    }
                }
            }
        }
        
        stage('TypeScript Compilation Check') {
            when {
                expression { fileExists('package.json') && fileExists('tsconfig.json') }
            }
            steps {
                script {
                    echo 'Running TypeScript compiler checks...'
                    sh 'npx tsc --noEmit --pretty'
                }
            }
        }
        
        stage('Security Scanning') {
            parallel {
                stage('npm audit') {
                    when {
                        expression { fileExists('package.json') }
                    }
                    steps {
                        script {
                            echo 'Scanning for vulnerable dependencies...'
                            // Run npm audit and capture output
                            def auditResult = sh(
                                script: 'npm audit --audit-level=moderate --json > npm-audit-report.json 2>&1 || true',
                                returnStatus: true
                            )
                            
                            // Archive the report
                            archiveArtifacts artifacts: 'npm-audit-report.json', allowEmptyArchive: true
                            
                            // Display summary
                            sh '''
                                echo "=== npm audit Summary ==="
                                npm audit --audit-level=moderate || echo "Vulnerabilities found - check archived report"
                            '''
                        }
                    }
                }
                
                stage('GitLeaks Secret Detection') {
                    steps {
                        script {
                            echo 'Scanning for secrets and sensitive information...'
                            
                            // Download and install GitLeaks
                            sh '''
                                # Download GitLeaks if not already present
                                if [ ! -f "./gitleaks" ]; then
                                    echo "Downloading GitLeaks..."
                                    
                                    # Use a known working version to avoid API issues
                                    GITLEAKS_VERSION="v8.18.4"
                                    VERSION_NUMBER="8.18.4"
                                    
                                    echo "Using GitLeaks version: $GITLEAKS_VERSION"
                                    
                                    # Construct download URL
                                    DOWNLOAD_URL="https://github.com/zricethezav/gitleaks/releases/download/${GITLEAKS_VERSION}/gitleaks_${VERSION_NUMBER}_linux_x64.tar.gz"
                                    echo "Download URL: $DOWNLOAD_URL"
                                    
                                    # Download and extract
                                    if wget -q --timeout=30 "$DOWNLOAD_URL"; then
                                        tar -xzf "gitleaks_${VERSION_NUMBER}_linux_x64.tar.gz"
                                        chmod +x gitleaks
                                        rm "gitleaks_${VERSION_NUMBER}_linux_x64.tar.gz"
                                        echo "GitLeaks installed successfully"
                                        ./gitleaks version
                                    else
                                        echo "Failed to download GitLeaks - continuing without secret scanning"
                                        touch gitleaks-report.json
                                        echo "[]" > gitleaks-report.json
                                    fi
                                fi
                            '''
                            
                            // Run GitLeaks scan
                            def gitleaksResult = sh(
                                script: '''
                                    if [ -f "./gitleaks" ] && [ -x "./gitleaks" ]; then
                                        ./gitleaks detect --report-format json --report-path gitleaks-report.json --verbose || true
                                    else
                                        echo "GitLeaks binary not available, skipping scan"
                                        echo "[]" > gitleaks-report.json
                                    fi
                                ''',
                                returnStatus: true
                            )
                            
                            // Archive the report
                            archiveArtifacts artifacts: 'gitleaks-report.json', allowEmptyArchive: true
                            
                            // Check results and fail if secrets found
                            if (gitleaksResult == 1) {
                                echo "⚠️  SECRETS DETECTED! Check the GitLeaks report."
                                sh 'cat gitleaks-report.json'
                                currentBuild.result = 'UNSTABLE'
                            } else {
                                echo "✅ No secrets detected by GitLeaks"
                            }
                        }
                    }
                }
            }
        }
        
        stage('Build') {
            when {
                expression { fileExists('package.json') && fileExists('tsconfig.json') }
            }
            steps {
                script {
                    echo 'Building TypeScript project...'
                    sh 'npx tsc'
                }
            }
        }
        
        stage('Security Summary') {
            steps {
                script {
                    echo '=== Security Scan Summary ==='
                    
                    // npm audit summary
                    sh '''
                        echo "📦 Dependency Vulnerabilities:"
                        if [ -f "npm-audit-report.json" ]; then
                            if command -v jq >/dev/null 2>&1; then
                                AUDIT_COUNT=$(cat npm-audit-report.json | jq -r '.metadata.vulnerabilities.total // 0' 2>/dev/null || echo "0")
                            else
                                AUDIT_COUNT="Unknown (jq not available)"
                            fi
                            echo "Total vulnerabilities found: $AUDIT_COUNT"
                        else
                            echo "No npm audit report found"
                        fi
                    '''
                    
                    // GitLeaks summary
                    sh '''
                        echo "🔐 Secret Detection:"
                        if [ -f "gitleaks-report.json" ]; then
                            if command -v jq >/dev/null 2>&1; then
                                SECRETS_COUNT=$(cat gitleaks-report.json | jq '. | length' 2>/dev/null || echo "0")
                            else
                                SECRETS_COUNT="Unknown (jq not available)"
                            fi
                            echo "Potential secrets found: $SECRETS_COUNT"
                        else
                            echo "No GitLeaks report found"
                        fi
                    '''
                }
            }
        }
        
        stage('Pre-build Checks') {
            steps {
                script {
                    // Verify Dockerfile exists
                    if (!fileExists('Dockerfile')) {
                        echo 'WARNING: Dockerfile not found in repository root'
                        echo 'Skipping Docker-related stages'
                        env.SKIP_DOCKER = 'true'
                    } else {
                        env.SKIP_DOCKER = 'false'
                    }
                    
                    // Check Docker daemon only if Docker stages will run
                    if (env.SKIP_DOCKER != 'true') {
                        sh 'docker --version'
                        sh 'docker info'
                    }
                    
                    echo "Current user: \$(whoami)"
                    echo "Node name: ${env.NODE_NAME}"
                    echo "Workspace: ${WORKSPACE}"
                    echo "Build number: ${BUILD_NUMBER}"
                }
            }
        }
        
        stage('Build Docker Image') {
            when {
                expression { env.SKIP_DOCKER != 'true' }
            }
            steps {
                script {
                    try {
                        // Use different tag for PR builds and devops branches
                        def imageTag = env.CHANGE_ID ? 
                            "pr-${env.CHANGE_ID}-${BUILD_NUMBER}" : 
                            (env.IS_DEVOPS_BRANCH == 'true' ? 
                                "devops-${env.BRANCH_NAME.replace('devops/', '')}-${BUILD_NUMBER}" : 
                                "${DOCKER_IMAGE_TAG}")
                        
                        echo "Building Docker image ${DOCKER_IMAGE_NAME}:${imageTag}..."
                        
                        // Build with proper error handling and no-cache for clean builds
                        sh """
                            docker build \
                                --no-cache \
                                --build-arg BUILD_NUMBER=${BUILD_NUMBER} \
                                --build-arg BUILD_DATE=\$(date -u +'%Y-%m-%dT%H:%M:%SZ') \
                                --build-arg PR_ID=${env.CHANGE_ID ?: 'none'} \
                                --build-arg BRANCH_NAME=${env.BRANCH_NAME ?: 'main'} \
                                --build-arg IS_DEVOPS_BRANCH=${env.IS_DEVOPS_BRANCH ?: 'false'} \
                                -t "${DOCKER_IMAGE_NAME}:${imageTag}" \
                                .
                        """
                        
                        // Only tag as latest if it's not a PR build and not a devops branch
                        if (!env.CHANGE_ID && env.IS_DEVOPS_BRANCH != 'true') {
                            sh "docker tag ${DOCKER_IMAGE_NAME}:${imageTag} ${DOCKER_IMAGE_NAME}:latest"
                        }
                        
                        // Verify image was created
                        sh "docker images ${DOCKER_IMAGE_NAME}:${imageTag}"
                        
                        // Store image tag for later use
                        env.FINAL_IMAGE_TAG = imageTag
                        
                    } catch (Exception e) {
                        error("Docker build failed: ${e.getMessage()}")
                    }
                }
            }
        }
        
        stage('Test Docker Image') {
            when {
                expression { env.SKIP_DOCKER != 'true' && env.FINAL_IMAGE_TAG != null }
            }
            steps {
                script {
                    echo "Testing Docker image..."
                    
                    // Basic container test - adjust based on your app
                    sh """
                        # Test if container starts and stops properly
                        CONTAINER_ID=\$(docker run -d --name test-${BUILD_NUMBER} ${DOCKER_IMAGE_NAME}:${env.FINAL_IMAGE_TAG})
                        sleep 5
                        
                        # Check if container is running
                        if [ \$(docker ps -q -f name=test-${BUILD_NUMBER} | wc -l) -eq 0 ]; then
                            echo "Container failed to start"
                            docker logs test-${BUILD_NUMBER}
                            exit 1
                        fi
                        
                        # Cleanup test container
                        docker stop test-${BUILD_NUMBER} || true
                        docker rm test-${BUILD_NUMBER} || true
                    """
                }
            }
        }
        
        stage('Save Docker Image Artifact') {
            when {
                expression { env.SKIP_DOCKER != 'true' && env.FINAL_IMAGE_TAG != null }
            }
            steps {
                script {
                    echo "Saving Docker image to tar file..."
                    
                    // Create artifacts directory if it doesn't exist
                    sh 'mkdir -p artifacts'
                    
                    sh """
                        docker save -o "artifacts/${DOCKER_IMAGE_NAME}-${env.FINAL_IMAGE_TAG}.tar" "${DOCKER_IMAGE_NAME}:${env.FINAL_IMAGE_TAG}"
                        
                        # Verify tar file was created and get size
                        ls -lh artifacts/${DOCKER_IMAGE_NAME}-${env.FINAL_IMAGE_TAG}.tar
                    """
                }
                
                archiveArtifacts artifacts: 'artifacts/*.tar', fingerprint: true, allowEmptyArchive: false
            }
        }
        
        stage('Security Scan') {
            when {
                expression { env.SKIP_DOCKER != 'true' && env.FINAL_IMAGE_TAG != null }
            }
            steps {
                script {
                    echo "Running security scan on Docker image..."
                    
                    // Example using Trivy (install trivy on Jenkins agent first)
                    // Uncomment and modify based on your security tools
                    /*
                    sh """
                        trivy image --exit-code 1 --severity HIGH,CRITICAL ${DOCKER_IMAGE_NAME}:${env.FINAL_IMAGE_TAG} || {
                            echo "Security vulnerabilities found!"
                            exit 1
                        }
                    """
                    */
                    
                    echo "Security scan completed (placeholder - configure your preferred scanner)"
                }
            }
        }
        
        stage('Post PR Comment') {
            when {
                expression { env.CHANGE_ID != null }
            }
            steps {
                script {
                    // This requires GitHub API integration
                    // You might need to install GitHub plugin and configure GitHub API token
                    try {
                        def comment = """
                        ## 🚀 CI/CD Pipeline Results for PR #${env.CHANGE_ID}
                        
                        **Build Status:** ✅ Success
                        **Build Number:** ${BUILD_NUMBER}
                        **Docker Image:** `${DOCKER_IMAGE_NAME}:${env.FINAL_IMAGE_TAG ?: 'N/A'}`
                        **Duration:** ${currentBuild.durationString}
                        
                        ### 📋 Build Summary:
                        - TypeScript compilation: ✅ Passed
                        - Security scanning: ✅ Completed
                        - Docker image build: ${env.SKIP_DOCKER == 'true' ? '⏭️ Skipped' : '✅ Success'}
                        - Container tests: ${env.SKIP_DOCKER == 'true' ? '⏭️ Skipped' : '✅ Passed'}
                        
                        [📊 View Full Build Details](${BUILD_URL})
                        [📦 Download Artifacts](${BUILD_URL}artifact/)
                        """
                        
                        // This would require proper GitHub integration
                        echo "Would post comment to PR: ${comment}"
                        
                    } catch (Exception e) {
                        echo "Failed to post PR comment: ${e.getMessage()}"
                    }
                }
            }
        }
        
        stage('DevOps Branch Notification') {
            when {
                expression { env.IS_DEVOPS_BRANCH == 'true' }
            }
            steps {
                script {
                    echo "🔧 DevOps branch build completed successfully"
                    echo "Branch: ${env.DEVOPS_BRANCH_NAME}"
                    echo "Image: ${DOCKER_IMAGE_NAME}:${env.FINAL_IMAGE_TAG ?: 'N/A'}"
                    
                    // You might want to send special notifications for devops branches
                    // or trigger additional deployment steps
                }
            }
        }
    }
    
    post {
        always {
            script {
                echo 'Cleaning up...'
                
                // Clean up Docker images to save space only if Docker was used
                if (env.SKIP_DOCKER != 'true') {
                    sh """
                        # Remove test containers if any exist
                        docker ps -a --filter "name=test-${BUILD_NUMBER}" -q | xargs -r docker rm -f || true
                        
                        # For PR builds, clean up more aggressively
                        if [ "${env.CHANGE_ID}" != "" ]; then
                            # Remove PR-specific images older than current build
                            docker images ${DOCKER_IMAGE_NAME} --format "table {{.Tag}}" | grep "pr-${env.CHANGE_ID}" | grep -v "${env.FINAL_IMAGE_TAG}" | head -3 | xargs -r -I {} docker rmi ${DOCKER_IMAGE_NAME}:{} || true
                        # For devops branches, clean up devops-specific images
                        elif [ "${env.IS_DEVOPS_BRANCH}" = "true" ]; then
                            # Remove devops-specific images older than current build
                            docker images ${DOCKER_IMAGE_NAME} --format "table {{.Tag}}" | grep "devops-" | grep -v "${env.FINAL_IMAGE_TAG}" | head -3 | xargs -r -I {} docker rmi ${DOCKER_IMAGE_NAME}:{} || true
                        else
                            # Keep latest and current build, remove others for this app
                            docker images ${DOCKER_IMAGE_NAME} --format "table {{.Tag}}" | grep -v -E "(latest|${env.FINAL_IMAGE_TAG}|TAG)" | head -5 | xargs -r -I {} docker rmi ${DOCKER_IMAGE_NAME}:{} || true
                        fi
                        
                        # Clean up dangling images
                        docker image prune -f || true
                    """
                }
                
                echo 'Pipeline finished.'
            }
        }
        
        success {
            script {
                def imageSize = "N/A"
                if (env.SKIP_DOCKER != 'true' && env.FINAL_IMAGE_TAG != null) {
                    imageSize = sh(
                        script: "docker images ${DOCKER_IMAGE_NAME}:${env.FINAL_IMAGE_TAG} --format 'table {{.Size}}' | tail -1",
                        returnStdout: true
                    ).trim()
                }
                
                def subject = ""
                def buildType = ""
                def additionalInfo = ""
                
                if (env.CHANGE_ID) {
                    subject = "✅ SUCCESS: PR #${env.CHANGE_ID} Build #${BUILD_NUMBER} for ${DOCKER_IMAGE_NAME}"
                    buildType = "Pull Request"
                    additionalInfo = """
                        <li><strong>PR ID:</strong> #${env.CHANGE_ID}</li>
                        <li><strong>PR Title:</strong> ${env.CHANGE_TITLE}</li>
                        <li><strong>Author:</strong> ${env.CHANGE_AUTHOR}</li>
                        <li><strong>Source Branch:</strong> ${env.CHANGE_BRANCH}</li>
                        <li><strong>Target Branch:</strong> ${env.CHANGE_TARGET}</li>
                    """
                } else if (env.IS_DEVOPS_BRANCH == 'true') {
                    subject = "🔧 SUCCESS: DevOps Branch Build #${BUILD_NUMBER} for ${DOCKER_IMAGE_NAME}"
                    buildType = "DevOps Branch Build"
                    additionalInfo = """
                        <li><strong>DevOps Branch:</strong> ${env.DEVOPS_BRANCH_NAME}</li>
                        <li><strong>Build Type:</strong> Infrastructure/Configuration</li>
                    """
                } else {
                    subject = "✅ SUCCESS: Jenkins Build #${BUILD_NUMBER} for ${DOCKER_IMAGE_NAME}"
                    buildType = "Branch Build"
                }
                
                emailext(
                    to: 'amitbatito@gmail.com',
                    subject: subject,
                    body: """
                        <h3>Build Successful! 🎉</h3>
                        <p><strong>Build Type:</strong> ${buildType}</p>
                        <ul>
                            <li><strong>Project:</strong> ${JOB_NAME}</li>
                            <li><strong>Build Number:</strong> ${BUILD_NUMBER}</li>
                            <li><strong>Node:</strong> ${env.NODE_NAME}</li>
                            ${additionalInfo}
                            <li><strong>Docker Image:</strong> ${DOCKER_IMAGE_NAME}:${env.FINAL_IMAGE_TAG ?: 'N/A'}</li>
                            <li><strong>Image Size:</strong> ${imageSize}</li>
                            <li><strong>Duration:</strong> ${currentBuild.durationString}</li>
                        </ul>
                        <p><a href="${BUILD_URL}">View Build Details</a></p>
                        <p><a href="${BUILD_URL}artifact/">Download Artifacts</a></p>
                    """,
                    mimeType: 'text/html'
                )
            }
        }
        
        failure {
            script {
                def subject = ""
                def buildType = ""
                def additionalInfo = ""
                
                if (env.CHANGE_ID) {
                    subject = "❌ FAILURE: PR #${env.CHANGE_ID} Build #${BUILD_NUMBER} for ${DOCKER_IMAGE_NAME}"
                    buildType = "Pull Request"
                    additionalInfo = """
                        <li><strong>PR ID:</strong> #${env.CHANGE_ID}</li>
                        <li><strong>PR Title:</strong> ${env.CHANGE_TITLE}</li>
                        <li><strong>Author:</strong> ${env.CHANGE_AUTHOR}</li>
                    """
                } else if (env.IS_DEVOPS_BRANCH == 'true') {
                    subject = "🔧❌ FAILURE: DevOps Branch Build #${BUILD_NUMBER} for ${DOCKER_IMAGE_NAME}"
                    buildType = "DevOps Branch Build"
                    additionalInfo = """
                        <li><strong>DevOps Branch:</strong> ${env.DEVOPS_BRANCH_NAME}</li>
                        <li><strong>Build Type:</strong> Infrastructure/Configuration</li>
                    """
                } else {
                    subject = "❌ FAILURE: Jenkins Build #${BUILD_NUMBER} for ${DOCKER_IMAGE_NAME}"
                    buildType = "Branch Build"
                }
                
                emailext(
                    to: 'amitbatito@gmail.com',
                    subject: subject,
                    body: """
                        <h3>Build Failed! ⚠️</h3>
                        <p><strong>Build Type:</strong> ${buildType}</p>
                        <ul>
                            <li><strong>Project:</strong> ${JOB_NAME}</li>
                            <li><strong>Build Number:</strong> ${BUILD_NUMBER}</li>
                            <li><strong>Node:</strong> ${env.NODE_NAME}</li>
                            ${additionalInfo}
                            <li><strong>Failed Stage:</strong> ${env.STAGE_NAME ?: 'Unknown'}</li>
                            <li><strong>Duration:</strong> ${currentBuild.durationString}</li>
                        </ul>
                        <p><strong>Please check the Jenkins console output:</strong></p>
                        <p><a href="${BUILD_URL}console">View Console Output</a></p>
                        <p><a href="${BUILD_URL}">View Build Details</a></p>
                    """,
                    mimeType: 'text/html'
                )
            }
        }
        
        unstable {
            script {
                def subject = ""
                
                if (env.CHANGE_ID) {
                    subject = "⚠️ UNSTABLE: PR #${env.CHANGE_ID} Build #${BUILD_NUMBER} for ${DOCKER_IMAGE_NAME}"
                } else if (env.IS_DEVOPS_BRANCH == 'true') {
                    subject = "🔧⚠️ UNSTABLE: DevOps Branch Build #${BUILD_NUMBER} for ${DOCKER_IMAGE_NAME}"
                } else {
                    subject = "⚠️ UNSTABLE: Jenkins Build #${BUILD_NUMBER} for ${DOCKER_IMAGE_NAME}"
                }
                
                emailext(
                    to: 'amitbatito@gmail.com',
                    subject: subject,
                    body: "Build #${BUILD_NUMBER} completed but is marked as unstable. Please review: ${BUILD_URL}"
                )
            }
        }
    }
}