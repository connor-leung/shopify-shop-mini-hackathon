class CreateGameSessions < ActiveRecord::Migration[7.0]
  def change
    create_table :game_sessions do |t|
      t.references :user, null: false, foreign_key: true
      t.string :game_type, null: false, default: 'default'
      t.datetime :started_at, null: false
      t.datetime :completed_at
      t.timestamps
    end
    
    add_index :game_sessions, [:user_id, :started_at]
  end
end
