class CreateScores < ActiveRecord::Migration[7.0]
  def change
    create_table :scores do |t|
      t.references :user, null: false, foreign_key: true
      t.references :game_session, null: false, foreign_key: true
      t.integer :time_seconds, null: false
      t.integer :lives_remaining, null: false, default: 0
      t.integer :total_score, null: false
      t.json :additional_data
      t.timestamps
    end
    
    add_index :scores, [:user_id, :total_score]
    add_index :scores, [:total_score], order: :desc
  end
end
