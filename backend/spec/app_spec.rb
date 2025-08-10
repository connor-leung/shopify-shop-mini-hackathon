require 'spec_helper'

describe 'Socials API' do
  describe 'GET /' do
    it 'returns welcome message' do
      get '/'
      expect(last_response).to be_ok
      expect(JSON.parse(last_response.body)['message']).to eq('Socials API is running!')
    end
  end

  describe 'GET /health' do
    it 'returns health status' do
      get '/health'
      expect(last_response).to be_ok
      expect(JSON.parse(last_response.body)['status']).to eq('healthy')
    end
  end

  describe 'Users API' do
    describe 'GET /api/users' do
      it 'returns empty array when no users exist' do
        get '/api/users'
        expect(last_response).to be_ok
        expect(JSON.parse(last_response.body)).to eq([])
      end

      it 'returns users when they exist' do
        user = User.create!(username: 'testuser', email: 'test@example.com')
        get '/api/users'
        expect(last_response).to be_ok
        users = JSON.parse(last_response.body)
        expect(users.length).to eq(1)
        expect(users.first['username']).to eq('testuser')
      end
    end

    describe 'POST /api/users' do
      it 'creates a new user with valid data' do
        user_data = { user: { username: 'newuser', email: 'new@example.com' } }
        post '/api/users', user_data
        expect(last_response.status).to eq(201)
        user = JSON.parse(last_response.body)
        expect(user['username']).to eq('newuser')
        expect(user['email']).to eq('new@example.com')
      end

      it 'returns errors with invalid data' do
        user_data = { user: { username: '', email: '' } }
        post '/api/users', user_data
        expect(last_response.status).to eq(422)
        errors = JSON.parse(last_response.body)['errors']
        expect(errors).to include("Username can't be blank")
        expect(errors).to include("Email can't be blank")
      end
    end
  end

  describe 'Posts API' do
    let(:user) { User.create!(username: 'testuser', email: 'test@example.com') }

    describe 'GET /api/posts' do
      it 'returns empty array when no posts exist' do
        get '/api/posts'
        expect(last_response).to be_ok
        expect(JSON.parse(last_response.body)).to eq([])
      end

      it 'returns posts when they exist' do
        post = Post.create!(user: user, content: 'Test post content')
        get '/api/posts'
        expect(last_response).to be_ok
        posts = JSON.parse(last_response.body)
        expect(posts.length).to eq(1)
        expect(posts.first['content']).to eq('Test post content')
      end
    end

    describe 'POST /api/posts' do
      it 'creates a new post with valid data' do
        post_data = { post: { user_id: user.id, content: 'New post content' } }
        post '/api/posts', post_data
        expect(last_response.status).to eq(201)
        post = JSON.parse(last_response.body)
        expect(post['content']).to eq('New post content')
      end
    end
  end

  describe 'Comments API' do
    let(:user) { User.create!(username: 'testuser', email: 'test@example.com') }
    let(:post) { Post.create!(user: user, content: 'Test post') }

    describe 'GET /api/posts/:post_id/comments' do
      it 'returns empty array when no comments exist' do
        get "/api/posts/#{post.id}/comments"
        expect(last_response).to be_ok
        expect(JSON.parse(last_response.body)).to eq([])
      end

      it 'returns comments when they exist' do
        comment = Comment.create!(user: user, post: post, content: 'Test comment')
        get "/api/posts/#{post.id}/comments"
        expect(last_response).to be_ok
        comments = JSON.parse(last_response.body)
        expect(comments.length).to eq(1)
        expect(comments.first['content']).to eq('Test comment')
      end
    end

    describe 'POST /api/posts/:post_id/comments' do
      it 'creates a new comment with valid data' do
        comment_data = { comment: { user_id: user.id, content: 'New comment' } }
        post "/api/posts/#{post.id}/comments", comment_data
        expect(last_response.status).to eq(201)
        comment = JSON.parse(last_response.body)
        expect(comment['content']).to eq('New comment')
        expect(comment['post_id']).to eq(post.id)
      end
    end
  end
end
